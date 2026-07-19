-- 005a_talla_3xl.sql
-- Corre esta SOLA en su propia query y espera a que diga Success antes de correr la siguiente
-- (Postgres no deja usar un valor de enum nuevo en la misma transacción en la que se crea).
alter type talla_enum add value if not exists 'XXXL';
