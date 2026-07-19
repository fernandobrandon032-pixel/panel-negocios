-- 006_costos_blank_color.sql
-- Antes bz_costos_blank guardaba un solo precio "promedio" por corte+talla, mezclando blanco y
-- negro. Ahora cada color tiene su precio real, sin promediar.

alter table bz_costos_blank add column if not exists color text not null default 'Blanco';

alter table bz_costos_blank drop constraint if exists bz_costos_blank_corte_talla_key;
alter table bz_costos_blank add constraint bz_costos_blank_corte_color_talla_key unique (corte, color, talla);

-- Precios reales confirmados (de tu lista de Euro Cotton) por color, sin promediar.
insert into bz_costos_blank (corte, color, talla, precio) values
  ('Corte Recto', 'Blanco', 'S', 40.50),
  ('Corte Recto', 'Blanco', 'M', 40.50),
  ('Corte Recto', 'Blanco', 'L', 40.50),
  ('Corte Recto', 'Blanco', 'XL', 40.50),
  ('Corte Recto', 'Blanco', 'XXL', 50.50),
  ('Corte Recto', 'Blanco', 'XXXL', 63.00),
  ('Corte Recto', 'Negro', 'S', 47.50),
  ('Corte Recto', 'Negro', 'M', 47.50),
  ('Corte Recto', 'Negro', 'L', 47.50),
  ('Corte Recto', 'Negro', 'XL', 47.50),
  ('Corte Recto', 'Negro', 'XXL', 60.00),
  ('Corte Recto', 'Negro', 'XXXL', 75.00),
  ('Corte Oversize', 'Blanco', 'S', 76.00),
  ('Corte Oversize', 'Negro', 'M', 84.00),
  ('Corte Oversize', 'Blanco', 'XXL', 87.00),
  ('Corte Oversize', 'Negro', 'XXL', 99.00)
on conflict (corte, color, talla) do update set precio = excluded.precio;
