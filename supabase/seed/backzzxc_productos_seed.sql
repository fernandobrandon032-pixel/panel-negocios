-- backzzxc_productos_seed.sql
-- Los 16 productos de Backzzxc ya confirmados por nombre en la conversación original.
-- Precio según el default de su corte (editable después desde la app). Las 5 tallas se crean
-- en 0 (el inventario real se llena a mano, a propósito). Sin fotos todavía.
--
-- IMPORTANTE: hay ~33 piezas más del catálogo identificadas solo por código de foto
-- (IMG_xxxx) que TODAVÍA NO tienen nombre confirmado. A propósito NO se siembran aquí para
-- no inventar nombres — el usuario las debe agregar él mismo desde el formulario "Nuevo
-- producto" una vez que tenga las fotos organizadas y sepa qué diseño es cada una.

do $$
declare
  v_precio_recto numeric(10,2) := 250;
  v_producto record;
  v_producto_id uuid;
  v_talla talla_enum;
begin
  for v_producto in
    select * from (values
      ('Amiri 01', 'Corte Recto'::corte_enum),
      ('Amiri 02', 'Corte Recto'::corte_enum),
      ('Anti Social Social Club', 'Corte Recto'::corte_enum),
      ('Anti Social Social Club 02', 'Corte Recto'::corte_enum),
      ('Anti Social Social Club x Sadboyz — El Ángel Azul', 'Corte Recto'::corte_enum),
      ('Sadboyz For Life', 'Corte Recto'::corte_enum),
      ('Boss 01', 'Corte Recto'::corte_enum),
      ('Boss 02', 'Corte Recto'::corte_enum),
      ('Boss 03', 'Corte Recto'::corte_enum),
      ('Boss 04', 'Corte Recto'::corte_enum),
      ('Hugo 01', 'Corte Recto'::corte_enum),
      ('Hugo 03', 'Corte Recto'::corte_enum),
      ('Hugo 04', 'Corte Recto'::corte_enum),
      ('Hugo (Fuego)', 'Corte Recto'::corte_enum),
      ('Hugo (Recuadro)', 'Corte Recto'::corte_enum),
      ('Stussy 01', 'Corte Recto'::corte_enum)
    ) as t(nombre, corte)
  loop
    insert into bz_productos (nombre, corte, categoria, precio)
    values (v_producto.nombre, v_producto.corte, 'General', v_precio_recto)
    returning id into v_producto_id;

    foreach v_talla in array enum_range(null::talla_enum)
    loop
      insert into bz_producto_tallas (producto_id, talla, cantidad)
      values (v_producto_id, v_talla, 0);
    end loop;
  end loop;
end $$;

-- Precios de referencia de costos de insumos ya conocidos (el resto se llena desde la app).
-- Las claves *_watts y *_minutos_lote son las que usa el cálculo de costo por playera
-- (src/lib/costCalc.ts); las *_compra son solo informativas (precio de compra del equipo).
insert into bz_costos_insumos (clave, valor, unidad, notas) values
  ('dtf_por_metro', 200, 'MXN/metro lineal (57cm ancho)', null),
  ('dtf_disenos_grandes_por_metro', 5.5, 'diseños/metro', 'espalda o pecho grande'),
  ('dtf_disenos_chicos_por_metro', 10, 'diseños/metro', 'solo pecho'),
  ('bolsa_unidad', 1.30, 'MXN/unidad', '$259 por 200 unidades'),
  ('cinta_termica_unidad', 0, 'MXN/unidad', 'PENDIENTE: el usuario todavía no dio este costo'),
  ('plancha_grande_watts', 900, 'W', 'confirmado en ficha de Mercado Libre'),
  ('plancha_grande_compra', 3587, 'MXN', 'precio de compra del equipo, no entra en el costo por playera'),
  ('plancha_chica_watts', 464, 'W', 'estimado'),
  ('plancha_chica_compra', 464, 'MXN', 'precio de compra del equipo, no entra en el costo por playera'),
  ('lote_minutos_plancha_grande', 150, 'minutos', 'de los ~180 min (3h) que dura un lote de 20 playeras'),
  ('lote_minutos_plancha_chica', 30, 'minutos', 'los últimos ~30 min del lote'),
  ('playeras_por_lote', 20, 'playeras', null),
  ('tarifa_cfe_kwh', 0.90, 'MXN/kWh', 'estimado tarifa 1F Hermosillo, confirmar con recibo real')
on conflict (clave) do nothing;

-- Precios de Euro Cotton (playera en blanco) ya confirmados. Faltan varias tallas — se
-- agregan después desde la app conforme el usuario las vaya dando.
insert into bz_costos_blank (corte, talla, precio) values
  ('Corte Recto', 'S', 44.00),
  ('Corte Recto', 'XXL', 55.25),
  ('Corte Oversize', 'S', 76.00),
  ('Corte Oversize', 'M', 84.00),
  ('Corte Oversize', 'XXL', 93.00)
on conflict (corte, talla) do nothing;

-- Stock inicial de TurboPrints95 (mangas para el sol) — cantidades en 0, el usuario las llena.
insert into tp_stock (nombre, variante_label, tipo_variante, precio, costo, cantidad) values
  ('Mangas para el sol', 'Blanca', 'color', 50, 12, 0),
  ('Mangas para el sol', 'Negra', 'color', 50, 12, 0);

-- Meta de ahorro inicial (el carro).
insert into fz_meta_ahorro (nombre, monto_objetivo) values ('Carro', 30000);
