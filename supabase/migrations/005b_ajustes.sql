-- 005b_ajustes.sql
-- Corre esto después de que 005a haya dicho Success.

-- Rellena XXXL en 0 para todo lo que ya existe, para que la talla nueva aparezca en todos lados.
insert into bz_producto_tallas (producto_id, talla, cantidad)
select id, 'XXXL', 0 from bz_productos
on conflict (producto_id, talla) do nothing;

insert into stock_blancos (user_id, corte, color, talla, cantidad)
select distinct user_id, corte, color, 'XXXL', 0 from stock_blancos
on conflict (corte, color, talla) do nothing;

-- registrar_venta ahora acepta una fecha (para capturar ventas pasadas con su fecha real).
drop function if exists registrar_venta(uuid, jsonb, text, text);

create or replace function registrar_venta(
  p_cliente_id uuid,
  p_items jsonb,
  p_notas text default null,
  p_origen text default 'directa',
  p_fecha timestamptz default null
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

grant execute on function registrar_venta(uuid, jsonb, text, text, timestamptz) to authenticated;

-- Insumos: DTF directo en pesos por diseño (en vez de metro/ratio), y cinta térmica como gasto
-- periódico cada 6 meses en vez de por playera.
delete from bz_costos_insumos where clave in (
  'dtf_por_metro', 'dtf_disenos_grandes_por_metro', 'dtf_disenos_chicos_por_metro', 'cinta_termica_unidad'
);

insert into bz_costos_insumos (clave, valor, unidad, notas) values
  ('dtf_costo_diseno_grande', 36.36, 'MXN/playera', 'DTF $200/metro entre ~5.5 diseños grandes por metro'),
  ('dtf_costo_diseno_chico', 20.00, 'MXN/playera', 'DTF $200/metro entre ~10 diseños chicos por metro'),
  ('cinta_termica_costo', 60, 'MXN cada 6 meses', 'un rollo dura mucho, se compra cada ~6 meses'),
  ('cinta_termica_playeras_estimadas', 600, 'playeras cada 6 meses', 'estimado inicial, ajústalo cuando sepas cuántas playeras realmente salen en 6 meses')
on conflict (clave) do nothing;
