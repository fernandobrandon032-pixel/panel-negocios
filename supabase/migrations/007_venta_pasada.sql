-- 007_venta_pasada.sql
-- Permite registrar ventas pasadas (de piezas que ya no tienes en stock) sin que el sistema
-- rechace la venta por falta de stock ni descuente de un inventario que ya está en 0 por
-- correcto motivo (la pieza ya se vendió y se fue).

drop function if exists registrar_venta(uuid, jsonb, text, text, timestamptz);

create or replace function registrar_venta(
  p_cliente_id uuid,
  p_items jsonb,
  p_notas text default null,
  p_origen text default 'directa',
  p_fecha timestamptz default null,
  p_descontar_stock boolean default true
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

  insert into bz_ventas (user_id, cliente_id, notas, origen, fecha)
  values (auth.uid(), p_cliente_id, p_notas, p_origen, coalesce(p_fecha, now()))
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

    if p_descontar_stock then
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
    end if;

    insert into bz_venta_items (venta_id, producto_id, talla, cantidad, precio_unitario)
    values (v_venta_id, v_producto_id, v_talla, v_cantidad, v_precio);
  end loop;

  return v_venta_id;
end;
$$;

grant execute on function registrar_venta(uuid, jsonb, text, text, timestamptz, boolean) to authenticated;
