-- 008_editar_venta.sql
-- Permite editar una venta ya registrada (cliente, fecha, notas, productos/tallas/cantidades)
-- corrigiendo el stock correctamente: revierte el efecto de los items viejos y aplica el de
-- los nuevos, solo si la venta afecta el stock actual.

alter table bz_ventas add column if not exists descontar_stock boolean not null default true;

drop function if exists registrar_venta(uuid, jsonb, text, text, timestamptz, boolean);

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

  insert into bz_ventas (user_id, cliente_id, notas, origen, fecha, descontar_stock)
  values (auth.uid(), p_cliente_id, p_notas, p_origen, coalesce(p_fecha, now()), p_descontar_stock)
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

-- editar_venta: reemplaza cliente/fecha/notas/items de una venta ya existente, revirtiendo el
-- stock de los items viejos (si esa venta lo afectó) y aplicando el de los nuevos.
create or replace function editar_venta(
  p_venta_id uuid,
  p_cliente_id uuid,
  p_items jsonb,
  p_notas text default null,
  p_fecha timestamptz default null,
  p_descontar_stock boolean default true
)
returns void
language plpgsql
as $$
declare
  v_item jsonb;
  v_old_item record;
  v_producto_id uuid;
  v_talla talla_enum;
  v_cantidad int;
  v_precio numeric(10,2);
  v_stock_actual int;
  v_venta_actual bz_ventas%rowtype;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Una venta necesita al menos un producto';
  end if;

  select * into v_venta_actual from bz_ventas where id = p_venta_id for update;
  if v_venta_actual is null then
    raise exception 'Venta no encontrada: %', p_venta_id;
  end if;

  -- Revierte el efecto en stock de los items viejos, si esta venta lo afectó.
  if v_venta_actual.descontar_stock then
    for v_old_item in select producto_id, talla, cantidad from bz_venta_items where venta_id = p_venta_id
    loop
      update bz_producto_tallas
      set cantidad = cantidad + v_old_item.cantidad
      where producto_id = v_old_item.producto_id and talla = v_old_item.talla;
    end loop;
  end if;

  delete from bz_venta_items where venta_id = p_venta_id;

  update bz_ventas
  set cliente_id = p_cliente_id,
      notas = p_notas,
      fecha = coalesce(p_fecha, fecha),
      descontar_stock = p_descontar_stock
  where id = p_venta_id;

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
    values (p_venta_id, v_producto_id, v_talla, v_cantidad, v_precio);
  end loop;
end;
$$;

grant execute on function editar_venta(uuid, uuid, jsonb, text, timestamptz, boolean) to authenticated;
