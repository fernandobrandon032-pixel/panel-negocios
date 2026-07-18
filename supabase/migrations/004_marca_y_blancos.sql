-- 004_marca_y_blancos.sql
-- Agrega marca a los productos de Backzzxc (para poder agrupar el catálogo por marca) y una
-- tabla de stock de playeras en blanco COMPARTIDA entre Backzzxc y TurboPrints95 (ambos negocios
-- usan el mismo blanco para estampar, así que el inventario debe ser uno solo, no duplicado).

alter table bz_productos add column if not exists marca text;

create table if not exists stock_blancos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  corte corte_enum not null,
  color text not null,
  talla talla_enum not null,
  cantidad int not null default 0 check (cantidad >= 0),
  unique (corte, color, talla)
);

alter table stock_blancos enable row level security;
create policy "authenticated_all" on stock_blancos for all to authenticated using (true) with check (true);

grant select, insert, update, delete on stock_blancos to authenticated;

-- Necesario para que los cambios en esta tabla se transmitan en tiempo real entre pestañas.
alter publication supabase_realtime add table stock_blancos;

-- Semilla: blanco y negro en Corte Recto y Corte Oversize, las 5 tallas en 0 (edítalo tú con tu
-- stock real desde la pestaña "Blancos").
do $$
declare
  v_user_id uuid;
  v_corte corte_enum;
  v_color text;
  v_talla talla_enum;
begin
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then
    raise exception 'No hay ningun usuario creado todavia en Authentication > Users';
  end if;

  foreach v_corte in array array['Corte Recto'::corte_enum, 'Corte Oversize'::corte_enum]
  loop
    foreach v_color in array array['Blanco', 'Negro']
    loop
      foreach v_talla in array enum_range(null::talla_enum)
      loop
        insert into stock_blancos (user_id, corte, color, talla, cantidad)
        values (v_user_id, v_corte, v_color, v_talla, 0)
        on conflict (corte, color, talla) do nothing;
      end loop;
    end loop;
  end loop;
end $$;
