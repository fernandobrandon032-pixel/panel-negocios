# Traspaso: CRM de dos negocios (Backzzxc + TurboPrints95) + finanzas personales

## Contexto para quien retome esto (Claude Code)

Este proyecto empezó como un dashboard HTML de un solo archivo, hecho en Claude.ai (interfaz de chat),
para un usuario en Hermosillo, Sonora, que maneja dos negocios de playeras. El archivo único terminó
siendo un mal formato: al meter las fotos del catálogo como base64 dentro del mismo HTML, el archivo
superó el límite de tamaño que la plataforma permite para "Publicar" artefactos, y el usuario no podía
guardar sus cambios de forma confiable. Por eso se está migrando a un proyecto de verdad (archivos
separados, imágenes como assets normales, sin ese límite).

**Recomendación para la nueva construcción:** que sea una app local o desplegable normal (React/Vite,
o incluso HTML+JS+CSS separados en varios archivos), con las imágenes como archivos `.jpg`/`.webp`
sueltos en una carpeta `/assets`, no incrustadas en base64. Con Claude Code esto ya no debería ser
problema porque no hay límite de "publicar" — es un proyecto de archivos reales.

## Los dos negocios + el apartado personal

1. **Backzzxc** — venta de playeras de marca (mayoreo y menudeo). Reventa/colección de diseños de
   marcas como Amiri, Boss, Hugo, Anti Social Social Club, Stussy, AllSaints, etc. No son productos
   fabricados por el usuario — es catálogo de playeras que consigue y revende.
2. **TurboPrints95** — playeras personalizadas hechas por encargo (DTF, diseños a pedido), más un
   stock aparte de playeras de carros que a veces se vende por mayoreo a través de Backzzxc.
3. **Finanzas personales** — separado de los negocios, para gastos e ingresos propios del usuario
   (no de los negocios).

El usuario tiene 17 años (lo mencionó explícitamente en la conversación). Puede ser relevante para
el tono y las decisiones de producto si esto se retoma en otra sesión.

## Estructura de datos necesaria

### Backzzxc — Stock
Cada pieza de stock es un **modelo único de playera**, no una prenda genérica. Campos:
- `nombre` (texto — el nombre del diseño/marca, ej. "Amiri 01", "Boss 03")
- `corte` (`Corte Recto` | `Corte Oversize` | `Corte Polo` | `Corte Niño`)
- `fotos` (hasta 2 imágenes: frente y/o espalda del mismo modelo — **importante**: cuando el
  catálogo tiene fotos de frente y espalda por separado, son la MISMA pieza, no dos)
- `tallas` (S, M, L, XL, XXL) con cantidad disponible por talla
- `precio` (precio de venta)

**Precios base ya definidos por corte** (aplican salvo que el usuario ponga uno específico distinto):
- Corte Recto: $250
- Corte Oversize: $330
- Corte Niño: $230
- Corte Polo: sin definir todavía

### Catálogo real ya identificado (usar esto como semilla, no inventar nombres nuevos)

49 piezas conocidas por código de foto (código = nombre de archivo original en el Drive del usuario,
ej. `IMG_5344.HEIC`). 16 ya tienen nombre confirmado por el usuario o por análisis de imagen; el resto
sigue **sin nombre** — no inventar nombres para esas, dejarlas marcadas como pendientes:

| Código foto | Corte | Nombre |
|---|---|---|
| IMG_5344 | Corte Recto | Amiri 01 |
| IMG_5349 | Corte Recto | Amiri 02 |
| IMG_5361 | Corte Recto | Anti Social Social Club |
| IMG_6934 | Corte Recto | Anti Social Social Club 02 |
| IMG_5374 | Corte Recto | Anti Social Social Club x Sadboyz — El Ángel Azul |
| IMG_5378 | Corte Recto | Sadboyz For Life |
| IMG_5346 | Corte Recto | Boss 01 |
| IMG_5368 | Corte Recto | Boss 02 |
| IMG_5337 | Corte Recto | Boss 03 |
| IMG_5343 | Corte Recto | Boss 04 |
| IMG_5348 | Corte Recto | Hugo 01 |
| IMG_7782 | Corte Recto | Hugo 03 |
| IMG_7798 | Corte Recto | Hugo 04 |
| IMG_5364 | Corte Recto | Hugo (Fuego) |
| IMG_5365 | Corte Recto | Hugo (Recuadro) |
| IMG_7803 | Corte Recto | Stussy 01 |

Piezas sin nombre todavía (todas Corte Recto salvo donde se indica Oversize) — **el usuario ya
identificó varias por su cuenta directamente en el dashboard** (ej. "AllSaints" ×4 en realidad eran
2 modelos con foto de frente/espalda repetida, "Cristo", "Balenciaga Cuello", "Off White", "Anti
Social X"). Esos nombres ya los escribió él, pero **viven solo en los datos del HTML anterior**, que
puede que no se hayan podido guardar por el problema de publicación — conviene pedirle al usuario que
los vuelva a decir si no aparecen en ningún respaldo:

IMG_6957, IMG_5383, IMG_8622, IMG_7807, IMG_8621, IMG_7806, IMG_7812, IMG_7813, IMG_6947, IMG_5387,
IMG_7778, IMG_5371, IMG_5379, IMG_6938, IMG_6939, IMG_6949, IMG_6952, IMG_7776, IMG_7804, IMG_7805,
IMG_7814, IMG_7815, IMG_8613, IMG_8614, IMG_8620, IMG_8624, IMG_8628, IMG_8629 (Corte Recto)
IMG_8650, IMG_8649, IMG_8627, IMG_7811, IMG_7810 (Corte Oversize)

**Las fotos originales** (HEIC) del catálogo completo del usuario están en su Google Drive. No pude
acceder a descargarlas ahí por un bloqueo de permisos del lado de la plataforma — al usuario le
funcionó mejor subirlas directo como adjuntos en el chat. Si Claude Code tiene acceso a la
computadora del usuario (vía terminal/VS Code), debería poder leer los archivos directo de su
carpeta local sin ese problema.

### Backzzxc — Clientes
`nombre`, `contacto`, `compras` (contador), `gastoTotal`, `ultimaCompra`, `notas`.
Se debe actualizar automáticamente cada vez que se registra una venta a ese cliente (buscar por
nombre, si no existe crearlo).

### Backzzxc — Prospectos (clientes potenciales)
`nombre`, `contacto`, `interes`, `estatus` (Nuevo / Contactado / Negociando / Ganado / Perdido), `fecha`.

### Backzzxc — Ventas
Cada venta descuenta del stock automáticamente. Campos: `modelo`, `talla`, `cantidad`, `precio`,
`cliente`, `fecha`. Debe soportar **venta mayoreo**: varias piezas distintas en una sola venta/cliente.

### Backzzxc — Consignación
El usuario tiene un acuerdo con un amigo (barbero, negocio cerca de su casa) para dejarle piezas en
exhibición sin que pague nada por adelantado. Campos: `socio`, `ubicacion`, `comision` (%), `fecha`,
lista de `piezas` (cada una con estado: En exhibición / Vendida / Devuelta). Al marcar una pieza
vendida: se descuenta del stock, se registra como venta, y se calcula la ganancia del usuario después
de la comisión del socio.

### Backzzxc — Costos de producción (para calcular margen real)
Datos reales que dio el usuario:
- Proveedor de playeras en blanco: **Euro Cotton** (no se pudo obtener el precio exacto por scraping,
  el usuario mandó screenshots con precios reales — ver tabla abajo)
- DTF: $200 por metro lineal (57cm de ancho). En un metro caben ~5.5 diseños grandes (espalda/pecho
  grande) o ~10 diseños chicos (solo pecho)
- Bolsas: $259 por 200 unidades = $1.30 c/u
- Cinta térmica: costo pendiente, el usuario no lo ha dado todavía
- Plancha grande: 900W (confirmado en la ficha de Mercado Libre), ~$3,587
- Plancha chica: ~464W estimado, $464 de costo
- Tiempo: ~3 horas por lote de 20 playeras, la plancha grande la mayor parte del tiempo y la chica
  los últimos ~30 min
- Tarifa eléctrica: CFE Hermosillo, tarifa 1F, ronda $0.80–$1.00/kWh en temporada de subsidio (el
  usuario debe confirmar con su recibo real)

Precios reales de Euro Cotton que el usuario compartió (por talla, playera SIN estampar):

| Corte | Talla | Precio |
|---|---|---|
| Corte Recto (Hombre) | CH (S) | $44.00 promedio (negro $47.50 / blanco $40.50) |
| Corte Recto (Hombre) | 2XG (≈XXL) | $55.25 promedio (negro $60.00 / blanco $50.50) |
| Corte Oversize | CH (S) | $76.00 (blanco) |
| Corte Oversize | M | $84.00 (negro) |
| Corte Oversize | 2XG (≈XXL) | $93.00 promedio (negro $99.00 / blanco $87.00) |

Faltan tallas M, L, XL de Corte Recto y L, XL de Corte Oversize — el usuario las puede seguir dando.

### TurboPrints95 — Pedidos personalizados
`cliente`, `diseno` (texto libre), `talla`, `precio`, `estatus` (Pendiente / En proceso / Listo /
Entregado), `fecha`. No tiene stock fijo — cada pedido es a la medida.

### TurboPrints95 — Stock propio
Aparte de los pedidos personalizados, el usuario mencionó que sí tiene productos con stock fijo:
- **Mangas para el sol** (arm sleeves), blancas y negras. Precio de venta $50, costo $12 c/u.
- Playeras de carros (JDM, etc.) — estas viven físicamente listadas dentro del stock de Backzzxc,
  categoría "Carros", porque también se venden por mayoreo desde ahí. El usuario iba a mandar el
  resto del inventario completo de TurboPrints95 y no llegó a hacerlo antes de este traspaso.

### TurboPrints95 — Clientes y Prospectos
Misma estructura que en Backzzxc, pero separado (son negocios distintos).

### Finanzas personales (aparte de ambos negocios)
- `balanceInicial` (número, ajustable)
- `movimientos`: cada uno con `tipo` (gasto/ingreso), `categoria`, `monto`, `descripcion`, `fecha`
- Categorías de gasto usadas: Entretenimiento/Gaming, Comida, Transporte, Renta/Servicios, Ropa,
  Salud, Ahorro, Negocio, Otro (o categoría libre)
- **Meta de ahorro**: el usuario está ahorrando para un **carro de $30,000**
- Quiere **presupuesto mensual por categoría** (límite + gasto real + barra de progreso)
- Quiere gráficos de pastel/dona para ver en qué se le va el dinero — chicos, a un costado, no
  ocupando toda la pantalla

## Decisiones de producto ya tomadas en la conversación (no volver a preguntar)

- El nombre de las playeras se pone a mano por el usuario (no siempre se puede identificar el diseño
  de forma confiable con IA a partir de fotos comprimidas — mejor no inventar).
- Cuando dos piezas tienen el mismo nombre + mismo corte, son front/back de la misma playera: hay que
  fusionarlas en un solo registro (combinar fotos, no duplicar filas). El usuario ya limpió esto
  manualmente varias veces porque el sistema anterior no lo hacía solo de forma confiable con datos
  ya escritos por el usuario — construir esto como una operación explícita (botón "fusionar con
  otra pieza") es más confiable que intentar automatizarlo con adivinación.
- Landing/portada: el usuario pidió varias veces un fondo temático (Spider-Man, un agujero negro,
  paisaje japonés) — en todos los casos se le explicó que no se puede reproducir arte de terceros con
  copyright (personajes de Marvel, wallpapers de sitios de terceros), y se ofreció recrear el
  *ambiente/estilo* como diseño original en su lugar. Esto no ha quedado resuelto — si se retoma,
  ofrecer de nuevo una versión original inspirada en la estética, no el archivo real.
- Logos reales de ambos negocios: el usuario **sí los creó él mismo y dio permiso explícito** de
  usarlos — no hay problema de derechos ahí. (Los logos no se adjuntan a este documento; el usuario
  los tiene y los puede volver a compartir.)
- El usuario prefiere que no le mande alertas de "stock bajo" (varias piezas naturalmente solo tienen
  2-3 unidades y está bien así).
- Precios sugeridos por corte (ver tabla arriba) deben autocompletarse al crear una pieza nueva, pero
  quedar editables.

## Lecciones técnicas de esta sesión (para no repetirlas)

1. **No metas imágenes en base64 dentro de un solo archivo HTML** si se va a usar la función
   "Publicar" de artefactos de Claude.ai — hay un límite de tamaño no documentado que se rebasa
   fácil con fotos de producto reales. Usa archivos de imagen sueltos referenciados por ruta/URL.
2. **Los `<a href="#">` disparan una confirmación nativa de "salir a enlace externo"** en el visor de
   artefactos de Claude.ai, sin importar `preventDefault()`. Usa `<button>` para cualquier acción que
   no sea navegación real.
3. **`window.confirm()`, `alert()` y `prompt()` nativos vienen bloqueados** en el sandbox del visor de
   artefactos — no fallan con error visible, simplemente no hacen nada. Hay que construir
   confirmaciones/diálogos propios con HTML.
4. El guardado automático de artefactos de Claude.ai (`window.storage`) **solo se activa si el
   artefacto está publicado**, y solo persiste si el usuario entra siempre desde la misma
   conversación de Claude — nunca abriendo el archivo `.html` descargado directo en el navegador
   (eso no tiene guardado, punto).

## Qué se le debe pedir al usuario si retoma esto en Claude Code

- El inventario real actualizado (qué tiene en stock ahora mismo, por talla) — todo se dejó en 0 a
  propósito para que él lo llenara.
- Las fotos del catálogo, idealmente ya organizadas y nombradas por él mismo desde su computadora
  (createó una carpeta local, mencionó una carpeta "Catálogo sin actualizar").
- El costo de la cinta térmica.
- Las tallas de Euro Cotton que faltan (M, L, XL en Corte Recto; L, XL en Corte Oversize).
- El resto del inventario de TurboPrints95 (aparte de las mangas para el sol).
- Su tarifa real de CFE (del recibo) para el cálculo de luz.

## Archivo de referencia

Se adjunta también `dashboard-negocios.html`, el prototipo funcional de un solo archivo construido
en esta conversación. Sirve como referencia de la lógica de negocio (cálculos, flujos de venta,
consignación, costos de producción) aunque la implementación técnica (todo en un HTML) no es la que
se recomienda continuar.
