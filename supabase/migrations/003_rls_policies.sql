-- 003_rls_policies.sql
-- Modelo de seguridad: app de un usuario (posiblemente un colaborador de confianza después).
-- Cualquier usuario autenticado puede leer/escribir todo. Los anónimos no ven nada.
-- La llave pública (anon key) va en el bundle de JS y es visible para cualquiera, así que
-- esto es lo mínimo indispensable: sin esto, cualquiera con la URL podría leer/escribir datos.
--
-- Camino de escalamiento futuro (si algún día hace falta separar datos por usuario real):
-- cambiar `using (true)` por `using (auth.uid() = user_id)` en cada política — la columna
-- user_id ya existe en todas las tablas, así que sería solo un cambio de política, no de esquema.

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'bz_productos', 'bz_producto_fotos', 'bz_producto_tallas', 'bz_clientes', 'bz_prospectos',
      'bz_ventas', 'bz_venta_items', 'bz_consignaciones', 'bz_consignacion_piezas',
      'bz_costos_insumos', 'bz_costos_blank',
      'tp_clientes', 'tp_prospectos', 'tp_pedidos', 'tp_stock',
      'fz_movimientos', 'fz_presupuestos', 'fz_meta_ahorro'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "authenticated_all" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ---------- STORAGE: fotos de productos ----------

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

create policy "productos_lectura_publica"
on storage.objects for select
to public
using (bucket_id = 'productos');

create policy "productos_escritura_autenticados"
on storage.objects for insert
to authenticated
with check (bucket_id = 'productos');

create policy "productos_actualizar_autenticados"
on storage.objects for update
to authenticated
using (bucket_id = 'productos');

create policy "productos_borrar_autenticados"
on storage.objects for delete
to authenticated
using (bucket_id = 'productos');
