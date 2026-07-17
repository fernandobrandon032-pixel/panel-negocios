-- 001_schema.sql
-- Esquema base: enums, tablas y vistas para Backzzxc, TurboPrints95 y Finanzas personales.
-- Ejecutar completo en el SQL Editor de Supabase, de una sola vez.

-- ---------- ENUMS ----------

create type corte_enum as enum ('Corte Recto', 'Corte Oversize', 'Corte Polo', 'Corte Niño');
create type talla_enum as enum ('S', 'M', 'L', 'XL', 'XXL');
create type foto_tipo_enum as enum ('frente', 'espalda');
create type prospecto_estatus_enum as enum ('Nuevo', 'Contactado', 'Negociando', 'Ganado', 'Perdido');
create type consignacion_estado_enum as enum ('en_exhibicion', 'vendida', 'devuelta');
create type pedido_estatus_enum as enum ('Pendiente', 'En proceso', 'Listo', 'Entregado');
create type movimiento_tipo_enum as enum ('gasto', 'ingreso');
create type variante_tipo_enum as enum ('talla', 'color');

-- ---------- BACKZZXC ----------

create table bz_productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  corte corte_enum not null,
  categoria text not null default 'General',
  precio numeric(10,2) not null,
  notas text,
  created_at timestamptz not null default now()
);

create table bz_producto_fotos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references bz_productos(id) on delete cascade,
  tipo foto_tipo_enum not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (producto_id, tipo)
);

create table bz_producto_tallas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references bz_productos(id) on delete cascade,
  talla talla_enum not null,
  cantidad int not null default 0 check (cantidad >= 0),
  unique (producto_id, talla)
);

create table bz_clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  contacto text,
  notas text,
  created_at timestamptz not null default now()
);

create table bz_prospectos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  contacto text,
  interes text,
  estatus prospecto_estatus_enum not null default 'Nuevo',
  fecha date not null default current_date
);

create table bz_ventas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  cliente_id uuid references bz_clientes(id),
  fecha timestamptz not null default now(),
  notas text,
  origen text not null default 'directa' check (origen in ('directa', 'consignacion'))
);

create table bz_venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references bz_ventas(id) on delete cascade,
  producto_id uuid not null references bz_productos(id),
  talla talla_enum not null,
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null
);

-- Stats de clientes derivadas de ventas reales, nunca guardadas por separado (evita desincronía).
create view bz_clientes_stats with (security_invoker = true) as
  select
    v.cliente_id,
    count(distinct v.id) as compras,
    sum(vi.cantidad * vi.precio_unitario) as gasto_total,
    max(v.fecha) as ultima_compra
  from bz_ventas v
  join bz_venta_items vi on vi.venta_id = v.id
  where v.cliente_id is not null
  group by v.cliente_id;

create table bz_consignaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  socio text not null,
  ubicacion text,
  comision_pct numeric(5,2) not null default 0 check (comision_pct >= 0 and comision_pct <= 100),
  fecha date not null default current_date,
  notas text
);

create table bz_consignacion_piezas (
  id uuid primary key default gen_random_uuid(),
  consignacion_id uuid not null references bz_consignaciones(id) on delete cascade,
  producto_id uuid not null references bz_productos(id),
  talla talla_enum not null,
  cantidad int not null default 1 check (cantidad > 0),
  estado consignacion_estado_enum not null default 'en_exhibicion',
  fecha_estado timestamptz not null default now(),
  precio_venta numeric(10,2),
  comision_monto numeric(10,2),
  ganancia_usuario numeric(10,2),
  venta_id uuid references bz_ventas(id)
);

-- Costos de insumos editables (DTF, bolsas, cinta térmica, planchas, tarifa CFE, etc).
create table bz_costos_insumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  clave text not null unique,
  valor numeric not null,
  unidad text,
  notas text
);

-- Precios de playera en blanco (Euro Cotton) por corte + talla.
create table bz_costos_blank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  corte corte_enum not null,
  talla talla_enum not null,
  precio numeric(10,2) not null,
  unique (corte, talla)
);

-- ---------- TURBOPRINTS95 ----------

create table tp_clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  contacto text,
  notas text,
  created_at timestamptz not null default now()
);

create table tp_prospectos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  contacto text,
  interes text,
  estatus prospecto_estatus_enum not null default 'Nuevo',
  fecha date not null default current_date
);

create table tp_pedidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  cliente_id uuid references tp_clientes(id),
  diseno text not null,
  talla talla_enum,
  precio numeric(10,2) not null,
  estatus pedido_estatus_enum not null default 'Pendiente',
  fecha date not null default current_date
);

-- Stock propio de TurboPrints (mangas para el sol, etc). Variante genérica: talla O color.
create table tp_stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  variante_label text not null,
  tipo_variante variante_tipo_enum not null default 'talla',
  precio numeric(10,2) not null,
  costo numeric(10,2),
  cantidad int not null default 0 check (cantidad >= 0)
);

-- ---------- FINANZAS PERSONALES ----------

create table fz_movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  tipo movimiento_tipo_enum not null,
  categoria text not null,
  monto numeric(10,2) not null check (monto > 0),
  descripcion text,
  fecha date not null default current_date
);

create table fz_presupuestos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  categoria text not null,
  mes date not null,
  limite numeric(10,2) not null,
  unique (user_id, categoria, mes)
);

create view fz_presupuesto_progreso with (security_invoker = true) as
  select
    p.id,
    p.user_id,
    p.categoria,
    p.mes,
    p.limite,
    coalesce(sum(m.monto) filter (
      where m.tipo = 'gasto'
        and date_trunc('month', m.fecha) = date_trunc('month', p.mes)
    ), 0) as gasto_real
  from fz_presupuestos p
  left join fz_movimientos m
    on m.user_id = p.user_id
   and m.categoria = p.categoria
  group by p.id, p.user_id, p.categoria, p.mes, p.limite;

create table fz_meta_ahorro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null default 'Carro',
  monto_objetivo numeric(10,2) not null default 30000
);

-- ---------- GRANTS BASE ----------
-- RLS (003_rls_policies.sql) es lo que realmente restringe el acceso; estos GRANT solo
-- habilitan que el rol pueda intentar la operación.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on bz_clientes_stats, fz_presupuesto_progreso to authenticated;
