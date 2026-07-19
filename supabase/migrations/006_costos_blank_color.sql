-- 006_costos_blank_color.sql
-- Antes bz_costos_blank guardaba un solo precio "promedio" por corte+talla, mezclando blanco y
-- negro. Ahora cada color tiene su precio real, sin promediar.

alter table bz_costos_blank add column if not exists color text not null default 'Blanco';

alter table bz_costos_blank drop constraint if exists bz_costos_blank_corte_talla_key;
alter table bz_costos_blank add constraint bz_costos_blank_corte_color_talla_key unique (corte, color, talla);

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then
    raise exception 'No hay ningun usuario creado todavia en Authentication > Users';
  end if;

  -- Precios reales confirmados (de tu lista de Euro Cotton) por color, sin promediar.
  insert into bz_costos_blank (user_id, corte, color, talla, precio) values
    (v_user_id, 'Corte Recto', 'Blanco', 'S', 40.50),
    (v_user_id, 'Corte Recto', 'Blanco', 'M', 40.50),
    (v_user_id, 'Corte Recto', 'Blanco', 'L', 40.50),
    (v_user_id, 'Corte Recto', 'Blanco', 'XL', 40.50),
    (v_user_id, 'Corte Recto', 'Blanco', 'XXL', 50.50),
    (v_user_id, 'Corte Recto', 'Blanco', 'XXXL', 63.00),
    (v_user_id, 'Corte Recto', 'Negro', 'S', 47.50),
    (v_user_id, 'Corte Recto', 'Negro', 'M', 47.50),
    (v_user_id, 'Corte Recto', 'Negro', 'L', 47.50),
    (v_user_id, 'Corte Recto', 'Negro', 'XL', 47.50),
    (v_user_id, 'Corte Recto', 'Negro', 'XXL', 60.00),
    (v_user_id, 'Corte Recto', 'Negro', 'XXXL', 75.00),
    (v_user_id, 'Corte Oversize', 'Blanco', 'S', 76.00),
    (v_user_id, 'Corte Oversize', 'Negro', 'M', 84.00),
    (v_user_id, 'Corte Oversize', 'Blanco', 'XXL', 87.00),
    (v_user_id, 'Corte Oversize', 'Negro', 'XXL', 99.00)
  on conflict (corte, color, talla) do update set precio = excluded.precio;
end $$;
