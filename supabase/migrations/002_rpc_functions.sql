-- 002_rpc_functions.sql
-- Funciones transaccionales: una venta con varias líneas debe descontar stock de forma
-- atómica (todo o nada), igual que marcar una pieza de consignación como vendida.

-- registrar_venta: crea una venta con N líneas y descuenta stock en la misma transacción.
-- p_items: jsonb array, cada elemento: {"producto_id": "...", "talla": "M", "cantidad": 2, "precio_unitario": 250}
create or replace function registrar_venta(
  p_cliente_id uuid,
  p_items jsonb,
  p_notas text default null,
  p_origen text default 'directa'
)
returns uuid
language plpgsql
as $$
declare
  v_venta_id uuid;
  v_item jsonb;
  v_producto_id uuid;
  v_talla talla_enum;
  v_cantidad int;
  v_precio numeric(10,2);
  v_stock_actual int;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Una venta necesita al menos un producto';
  end if;

  insert into bz_ventas (user_id, cliente_id, notas, origen)
  values (auth.uid(), p_cliente_id, p_notas, p_origen)
  returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_talla := (v_item->>'talla')::talla_enum;
    v_cantidad := (v_item->>'cantidad')::int;
    v_precio := (v_item->>'precio_unitario')::numeric(10,2);

    if v_cantidad <= 0 then
      raise exception 'La cantidad debe ser mayor a cero (producto %)', v_producto_id;
    end if;

    select cantidad into v_stock_actual
    from bz_producto_tallas
    where producto_id = v_producto_id and talla = v_talla
    for update;

    if v_stock_actual is null then
      raise exception 'No existe stock registrado para ese producto/talla (%, %)', v_producto_id, v_talla;
    end if;

    if v_stock_actual < v_cantidad then
      raise exception 'Stock insuficiente para % talla % (disponible: %, pedido: %)',
        v_producto_id, v_talla, v_stock_actual, v_cantidad;
    end if;

    update bz_producto_tallas
    set cantidad = cantidad - v_cantidad
    where producto_id = v_producto_id and talla = v_talla;

    insert into bz_venta_items (venta_id, producto_id, talla, cantidad, precio_unitario)
    values (v_venta_id, v_producto_id, v_talla, v_cantidad, v_precio);
  end loop;

  return v_venta_id;
end;
$$;

grant execute on function registrar_venta(uuid, jsonb, text, text) to authenticated;

-- marcar_pieza_vendida: pasa una pieza de consignación a "vendida", descuenta stock,
-- registra la venta y calcula la ganancia del usuario después de la comisión del socio.
create or replace function marcar_pieza_vendida(
  p_pieza_id uuid,
  p_precio_venta numeric
)
returns uuid
language plpgsql
as $$
declare
  v_pieza bz_consignacion_piezas%rowtype;
  v_comision_pct numeric(5,2);
  v_stock_actual int;
  v_venta_id uuid;
  v_comision_monto numeric(10,2);
  v_ganancia numeric(10,2);
begin
  select * into v_pieza
  from bz_consignacion_piezas
  where id = p_pieza_id
  for update;

  if v_pieza is null then
    raise exception 'Pieza de consignación no encontrada: %', p_pieza_id;
  end if;

  if v_pieza.estado <> 'en_exhibicion' then
    raise exception 'Esta pieza ya no está en exhibición (estado actual: %)', v_pieza.estado;
  end if;

  select comision_pct into v_comision_pct
  from bz_consignaciones
  where id = v_pieza.consignacion_id;

  select cantidad into v_stock_actual
  from bz_producto_tallas
  where producto_id = v_pieza.producto_id and talla = v_pieza.talla
  for update;

  if v_stock_actual is null or v_stock_actual < v_pieza.cantidad then
    raise exception 'Stock insuficiente para descontar la pieza vendida (producto %, talla %)',
      v_pieza.producto_id, v_pieza.talla;
  end if;

  update bz_producto_tallas
  set cantidad = cantidad - v_pieza.cantidad
  where producto_id = v_pieza.producto_id and talla = v_pieza.talla;

  insert into bz_ventas (user_id, cliente_id, notas, origen)
  values (auth.uid(), null, 'Venta por consignación', 'consignacion')
  returning id into v_venta_id;

  insert into bz_venta_items (venta_id, producto_id, talla, cantidad, precio_unitario)
  values (v_venta_id, v_pieza.producto_id, v_pieza.talla, v_pieza.cantidad, p_precio_venta);

  v_comision_monto := round((p_precio_venta * v_pieza.cantidad) * (v_comision_pct / 100.0), 2);
  v_ganancia := (p_precio_venta * v_pieza.cantidad) - v_comision_monto;

  update bz_consignacion_piezas
  set estado = 'vendida',
      fecha_estado = now(),
      precio_venta = p_precio_venta,
      comision_monto = v_comision_monto,
      ganancia_usuario = v_ganancia,
      venta_id = v_venta_id
  where id = p_pieza_id;

  return v_venta_id;
end;
$$;

grant execute on function marcar_pieza_vendida(uuid, numeric) to authenticated;
