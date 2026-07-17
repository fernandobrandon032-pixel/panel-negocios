# Panel de negocios — Backzzxc / TurboPrints95 / Finanzas

CRM para dos negocios de playeras (Backzzxc y TurboPrints95) más un apartado de finanzas
personales. Reemplaza al prototipo de un solo archivo HTML que se quedó sin espacio para
guardar cambios en Claude.ai — esta versión guarda todo en una base de datos real (Supabase) y
las fotos como archivos normales, así que ya no hay límite de tamaño.

Ver [`reference/traspaso-claude-code.md`](reference/traspaso-claude-code.md) para todo el
contexto de negocio (catálogo, costos, decisiones ya tomadas). El prototipo original
(`reference/dashboard-negocios.html`) queda solo como referencia visual.

## Qué necesitas antes de arrancar

Todo esto lo tienes que hacer tú (son cuentas y datos tuyos):

1. **Crear una cuenta gratuita en [supabase.com](https://supabase.com)** y un proyecto nuevo.
   Guarda la contraseña de la base de datos que te pida al crearlo.
2. **Correr las migraciones**: en tu proyecto de Supabase, ve a *SQL Editor* → *New query*, y
   pega y ejecuta, en este orden, el contenido completo de:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rpc_functions.sql`
   - `supabase/migrations/003_rls_policies.sql`
   - (opcional pero recomendado) `supabase/seed/backzzxc_productos_seed.sql` — mete los 16
     productos de Backzzxc que ya tenían nombre confirmado, con stock en 0 para que los llenes tú.
3. **Crear tu cuenta de acceso**: en el panel de Supabase ve a *Authentication → Users → Add
   user* y créate un usuario (correo + contraseña) — con esa cuenta vas a entrar a la app. Luego
   ve a *Authentication → Settings* y desactiva "Allow new users to sign up" para que nadie más
   pueda registrarse si encuentra la URL.
4. **Copiar tus llaves**: en *Settings → API* copia el "Project URL" y la "anon public key".
5. **Configurar el proyecto local**: copia `.env.example` a `.env` y pega ahí esos dos valores:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

## Correr en tu compu

```bash
npm install
npm run dev
```

Abre la URL que te dé (normalmente `http://localhost:5173`) y entra con la cuenta que creaste en
el paso 3.

## Publicarlo para entrar desde el celular

1. Crea una cuenta gratuita en [github.com](https://github.com) (si no tienes) y sube este
   proyecto a un repositorio.
2. Crea una cuenta gratuita en [vercel.com](https://vercel.com) (puedes entrar con tu cuenta de
   GitHub) e importa el repositorio.
3. En la configuración del proyecto en Vercel, agrega las mismas dos variables de entorno
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y despliega.
4. Desde tu celular, abre la URL que te dé Vercel y usa la opción "Agregar a pantalla de inicio"
   de tu navegador — queda instalada como si fuera una app.

## Estructura del proyecto

```
src/
  lib/            cliente de Supabase, tipos de la base de datos, cálculo de costos, formatos
  contexts/       sesión (login) y notificaciones (toast)
  theme/          los 3 temas visuales (Backzzxc / TurboPrints95 / Finanzas)
  components/     piezas compartidas: topbar, tabs, modal, subida de fotos, etc.
  features/
    backzzxc/     stock, clientes, prospectos, ventas, consignación, costos
    turboprints/  pedidos, stock propio, clientes, prospectos
    finanzas/     movimientos, presupuestos, meta de ahorro
supabase/
  migrations/     el esquema completo de la base de datos, en SQL
  seed/           datos iniciales (los 16 productos ya nombrados de Backzzxc)
```

## Lo que todavía te falta dar (para que la app quede completa)

- El inventario real actual, por talla, de cada producto de Backzzxc (se dejó en 0 a propósito).
- Las fotos del catálogo (organízalas y súbelas desde la pestaña Stock — ahí puedes elegir el
  archivo directo desde tu celular o compu, incluye conversión automática si son `.HEIC`).
- El costo de la cinta térmica (pestaña Costos de Backzzxc).
- Las tallas de Euro Cotton que faltan (M, L, XL en Corte Recto; L, XL en Corte Oversize).
- El resto del inventario de TurboPrints95 (aparte de las mangas para el sol).
- Tu tarifa real de CFE, tomada de un recibo (pestaña Costos).
- Los logos reales de Backzzxc y TurboPrints95 (reemplaza `public/icon.svg` y `public/favicon.svg`
  — ahora mismo son un placeholder simple).

## Notas técnicas

- El costo estimado por playera (pestaña Costos de Backzzxc) es una fórmula en
  `src/lib/costCalc.ts` que lee los insumos editables — ajústala ahí si cambia cómo calculas.
- Las ventas y las piezas de consignación vendidas descuentan stock de forma atómica mediante
  funciones de Postgres (`registrar_venta`, `marcar_pieza_vendida` en
  `supabase/migrations/002_rpc_functions.sql`), no desde el navegador — así nunca queda una venta
  a medias si se pierde la conexión.
- Las estadísticas de clientes (compras, gasto total, última compra) se calculan siempre desde
  las ventas reales (vista `bz_clientes_stats`), nunca se guardan por separado.
