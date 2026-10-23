# Manual Técnico

## Requisitos del sistema

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js | 20+ |
| npm | 9+ |
| MySQL | 8.0+ o MariaDB 10.4+ |
| Navegador | Chrome 90+, Firefox 90+, Edge 90+ |

## Instalación y ejecución

```bash
# Clonar repositorio
git clone https://github.com/ferdcard-ux/parque100-ecommerce.git
cd parque100-ecommerce

# Instalar dependencias
npm install

# Configurar base de datos (requiere MySQL)
mysql -u root < setup.sql

# Iniciar backend (Terminal 1)
npm run server

# Iniciar frontend (Terminal 2)
npm run dev

# Compilar para producción
npm run build
```

## Convenciones de código

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos de componente | PascalCase | `HeroBanner.tsx` |
| Archivos de servicio/hook | kebab-case | `product.service.ts` |
| Variables y funciones | camelCase | `formatPrice`, `cartCount` |
| Tipos e interfaces | PascalCase | `Product`, `CartItem` |
| Constantes globales | UPPER_SNAKE_CASE | `FREE_SHIPPING_THRESHOLD` |
| Props de componentes | PascalCase + `Props` sufijo | `HeroBannerProps` |

### Formato

- **Indentación**: 2 espacios (no tabs)
- **Comillas**: simples en JavaScript/TypeScript
- **Punto y coma**: obligatorio al final de cada sentencia
- **Longitud de línea**: máximo 100 caracteres
- **JSX**: cada prop en su propia línea si hay más de 3

### Comentarios

- Usar comentarios solo para explicar **por qué** se hace algo, no **qué** se hace
- Documentar interfaces públicas con JSDoc cuando sea necesario
- Marcar con `TODO:` las tareas pendientes

```typescript
// Correcto: explica la razón de una decisión
// Se usa setTimeout para dar feedback visual de "añadido"

// Incorrecto: el código ya explica qué hace
// Suma 1 al contador
```

## Estándares técnicos

### TypeScript

- Tipado explícito en todas las funciones y componentes
- Evitar `any` — usar `unknown` cuando el tipo no se conozca
- Preferir `interface` sobre `type` para objetos que se extienden
- Usar `type` para uniones y utilitarios

### React

- Componentes funcionales con hooks
- Props tipadas con interfaz dedicada
- Custom hooks para lógica reutilizable
- Estado elevado al contexto global cuando sea compartido

### Estilos

- Tailwind CSS v4 con clases utilitarias
- Variables CSS personalizadas en `theme.css` para el tema
- `style={{}}` inline solo para valores dinámicos o gradientes

## Importación y exportación del inventario

El inventario administrativo intercambia datos exclusivamente mediante libros `.xlsx` con
ExcelJS, cargado de forma diferida en el navegador. CSV y `.xls` no se aceptan; el PDF de
consulta es una función independiente y se conserva.

La plantilla tiene las hojas `Inventario`, `Catalogos` e `Instrucciones`. La hoja de datos
mantiene los 15 encabezados oficiales y ofrece filtros, encabezado inmovilizado, formatos de
celda y listas para los catálogos vigentes. La importación se limita a 5 MB y 5.000 filas,
rechaza fórmulas y contenido enriquecido, valida campos, IDs, precios, cantidades, fechas,
categorías y unidades, y no inicia escrituras si hay errores en los datos. Las altas y
actualizaciones se envían a la API individualmente; si hay un error del servidor durante esa
fase, algunos cambios anteriores pueden haberse aplicado y la interfaz informa cuántos.

## Base de datos

### Esquema

La base de demostración `parque100` consta de 10 tablas: `categorias`, `productos`, `unidades_medida`, `usuario`, `pedidos`, `detalle_pedido`, `transacciones_pago_demo`, `negocio`, `permisos_usuario` y `calificaciones`. Las credenciales del equipo, las sesiones y las aceptaciones del descargo residen en la base privada local independiente `parque100_acceso`, aprovisionada con `npm run access:provision`; nunca se agregan a `setup.sql` ni a `.BD/parque100.sql`. Sus tablas son `usuarios_acceso`, `aceptaciones_descargo` y `sesiones_acceso`.

La tabla `productos` incluye una columna `Imagen MEDIUMTEXT` opcional para almacenar URLs web o imagenes locales en dataURL al crear/editar productos desde el panel administrativo (el backend acepta cuerpos JSON de hasta 10 MB).

La tabla `unidades_medida` mantiene las opciones de contenido que se muestran en el inventario. En bases existentes, ejecuta `npm run migrate:product-catalogs` antes de reiniciar el backend. Al renombrar una unidad se actualizan los productos asociados; la eliminación se rechaza mientras la use algún producto.

La tabla `usuario` exige `Correo` y `Telefono` únicos en todo el sistema (índices `UNIQUE`; el teléfono admite `NULL`); el registro, el alta/edición admin y el perfil propio devuelven 409 específico si ya existen.

Los pedidos se fechan en horario del servidor (fecha local, sin desfase UTC). El flujo DEMO usa referencias/idempotencia internas y crea transacción, pedido y descuento de stock en una única transacción SQL. La cancelación restituye stock y anula el registro DEMO; no representa devolución de dinero. Los reportes excluyen pedidos DEMO de ventas y ticket promedio y los muestran por separado.

En bases ya instaladas aplica `npm run migrate:demo-payments` antes de activar `PAYMENTS_MODE=demo`; el comando crea únicamente `transacciones_pago_demo` y requiere permisos DDL MySQL. La tabla registra usuario, método DEMO, estado, importe calculado en servidor y referencia ficticia; no contiene PAN, CVV, OTP, datos de transferencia ni comprobantes. La aceptación de la transacción permanece en `paid: false`.

La tabla `sesiones_acceso` de `parque100_acceso` mantiene una fila por inicio de sesión y dispositivo. Su clave primaria es el `jti` del JWT (`ID_Sesion`); `ID_Acceso` referencia la cuenta y se elimina en cascada. Guarda `Creada_En`, `Ultima_Actividad`, `Revocada_En`, `User_Agent` y `Direccion_IP`. El backend valida en cada petición protegida que el `jti` corresponda a una fila no revocada de esa cuenta; el cierre de sesión revoca solo la fila actual y el panel puede revocar una o todas. Cambiar la contraseña o desactivar la cuenta revoca todas las filas. La migración `scripts/migrations/20261023-multi-session.sql` crea la tabla y copia la sesión vigente de las columnas antiguas `usuarios_acceso.Sesion_*`; esas columnas se conservan como respaldo de despliegue, pero no son la fuente autoritativa. La tabla se crea automáticamente al listar desde el panel o al aprovisionar; el usuario MySQL de la aplicación solo necesita `SELECT`, `INSERT` y `UPDATE`.

### Sincronización entre equipos

Los datos del proyecto son ficticios (creados para pruebas), por lo que el estado completo de la BD se comparte con los commits mediante el dump `.BD/parque100.sql`:

- **Exportar** (tras cambios en la BD local): `npm run db:dump` → guarda esquema + datos en `.BD/parque100.sql`; hay que commitear ese archivo.
- **Importar** (tras hacer pull): `npm run db:restore` → reemplaza las 10 tablas del proyecto por las del dump (idempotente).
- Ambos comandos (`scripts/db.mjs`) son multi-entorno (Windows, Linux, macOS) y localizan el cliente MySQL o MariaDB así: `MYSQL_BIN` → rutas por defecto de la plataforma (`C:\Program Files\MySQL\MySQL Server 8.4\bin`, `/usr/bin`, `/usr/local/bin`, `/usr/local/mysql/bin`, `/opt/homebrew/bin`) → `mysql`/`mysqldump` o `mariadb`/`mariadb-dump` en el PATH. Autenticación por entorno (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, ver `.env.example`).
- Para una BD nueva sin datos compartidos basta el esquema de `setup.sql`.

### Conexión

Archivo `server/config/db.js` — pool de conexiones MySQL con `mysql2/promise` (credenciales por entorno, con valores de desarrollo por defecto; el servidor carga `.env` si existe, ver `.env.example`):

```js
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parque100',
  waitForConnections: true,
  connectionLimit: 10,
});
```

> Este módulo es importado exclusivamente por la capa de modelos (`server/models/`). Ninguna ruta o controlador accede a la BD directamente.

## Backend Express

El backend sigue arquitectura MVC en capas: `routes → controllers → models → db` (detalle en [`arquitectura.md`](arquitectura.md)).

Corre en el puerto 3001 con las siguientes rutas:

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/products` | Listar productos con categoría |
| `GET /api/products/top-selling-week` | Producto con más unidades vendidas en los últimos 7 días |
| `GET /api/products/:id` | Producto por ID |
| `POST /api/products` | Crear producto (admin, validado) |
| `PUT /api/products/:id` | Actualizar producto (admin, validado; 404 si no existe) |
| `DELETE /api/products/:id` | Eliminar producto (admin; 409 si tiene pedidos) |
| `GET /api/categories` | Listar todas las categorías |
| `POST /api/categories` | Crear categoría (admin) |
| `PUT /api/categories/:id` | Renombrar categoría (admin) |
| `DELETE /api/categories/:id` | Eliminar categoría no utilizada (admin) |
| `GET /api/units` | Listar unidades de medida |
| `POST /api/units` | Crear unidad de medida (admin) |
| `PUT /api/units/:id` | Renombrar unidad y actualizar productos asociados (admin) |
| `DELETE /api/units/:id` | Eliminar unidad no utilizada (admin) |
| `POST /api/site-access/login` | Autenticar al equipo, crear una sesión de dispositivo y establecer cookie HttpOnly independiente |
| `POST /api/site-access/logout` | Revocar solo la sesión actual y borrar su cookie |
| `GET /api/site-access/disclaimer/status` | Consultar aceptación vigente para la sesión |
| `POST /api/site-access/disclaimer/accept` | Registrar aceptación del descargo |
| `POST /api/auth/login` | Iniciar sesión demo (emite JWT; requiere acceso web autorizado) |
| `POST /api/auth/register` | Registrar cuenta demo (requiere acceso académico y descargo; correo y teléfono únicos) |
| `POST /api/auth/recover` | 503 hasta configurar un canal verificado de recuperacion; no modifica ni registra contrasenas temporales |
| `PUT /api/auth/password` | Cambiar contraseña (valida la actual) |
| `GET /api/users` | Listar usuarios registrados (admin) |
| `POST /api/users` | Crear usuario desde el panel admin (admin) |
| `PUT /api/users/:id/admin` | Editar nombre, correo, rol y teléfono (admin) |
| `PUT /api/users/:id/profile` | Editar perfil propio (nombre, correo, teléfono; 409 si existen) |
| `DELETE /api/users/:id` | Eliminar usuario sin pedidos (admin; 409 si tiene) |
| `GET /api/users/:id` | Consultar datos de entrega (propio o admin) |
| `GET /api/users/:id/permissions` | Permisos delegables (propio o admin) |
| `PUT /api/users/:id/permissions` | Delegar `puede_cancelar` (admin) |
| `PUT /api/users/:id` | Actualizar teléfono, torre/bloque, piso y apartamento (propio o admin) |
| `GET /api/business` | Ficha del negocio |
| `PUT /api/business` | Actualizar ficha (admin) |
| `GET /api/orders` | Listar pedidos (staff: todos; cliente: propios; `?items=1` con detalles) |
| `GET /api/orders/:id` | Detalle de pedido con sus líneas (dueño o staff) |
| `POST /api/orders` | Crear pedido en efectivo (total recalculado en servidor, estado `pendiente`) |
| `POST /api/payments/process` | Iniciar intento DEMO con referencia e idempotencia, sin importe ni datos financieros |
| `POST /api/payments/confirm` | Confirmar pedido y transacción DEMO atomizados; recalcula importe y descuenta stock |
| `PUT /api/payments/:reference/cancel` | Cerrar un intento DEMO aún no confirmado |
| `PUT /api/orders/:id/status` | Avanzar estado (staff; `pendiente → preparando → enviando → entregado`, 409 ante saltos/retrocesos) |
| `PUT /api/orders/:id/cancel` | Cancelar con motivo (devuelve stock; actor del token; 400 sin motivo, 409 si el estado no admite) |
| `GET /api/ratings` | Listar calificaciones (filtros `producto`, `pedido`, `usuario`) |
| `GET /api/ratings/resumen?producto=ID` | Promedio y total de un producto |
| `POST /api/ratings` | Calificar (sesión; compra/propiedad verificada, 409 duplicada) |
| `PUT /api/ratings/:id` | Editar reseña (solo el autor) |
| `DELETE /api/ratings/:id` | Eliminar calificación (admin) |

> Salvo lectura pública (catálogo, negocio, reseñas), los endpoints exigen `Authorization: Bearer <JWT>`; la escritura sensible y los datos ajenos exigen rol `admin` o staff según la ruta.

### Producto más vendido semanal

`GET /api/products/top-selling-week` es una lectura pública dentro de la sesión académica. Devuelve el producto líder y sus métricas:

```json
{
  "product": { "ID_Producto": "P399", "Nombre": "Pollo PROMOCION entero despresado (1800 gr)" },
  "unitsSold": 2,
  "ordersCount": 1
}
```

El cálculo usa `detalle_pedido` y `pedidos` de los últimos 7 días (`DATE_SUB(CURDATE(), INTERVAL 7 DAY)`), agrupa por producto, suma `Cantidad` y cuenta pedidos distintos. Excluye pedidos cancelados y pagos DEMO. El desempate es por unidades vendidas, pedidos, última venta e ID. Si no hay ventas válidas, responde `product: null`, `unitsSold: 0` y `ordersCount: 0`; el frontend no renderiza el panel. La ruta se registra antes de `/products/:id` y la respuesta se sirve con `Cache-Control: no-store`.

### Registro de actividad del sitio

El middleware `server/utils/activity-log.js` registra una lista acotada de
acciones de negocio después de que el middleware global autentica la sesión
académica. Las acciones que solo ocurren en el navegador (añadir/quitar del
carrito, favoritos y cierre de sesión) se envían a `POST
/api/activity/interactions`, que acepta exclusivamente eventos enumerados y
limita solicitudes. Cuando existe una cuenta de tienda autenticada, conserva
su ID y rol junto a la identidad académica. Guarda fecha UTC, acción, resultado
HTTP e identificadores; no registra cuerpos, contraseñas, cookies, IP ni datos
financieros. El archivo local es
`server/logs/site-activity.jsonl`; se limita a 5 MB y mantiene una sola rotación
de respaldo (`.1`). Está excluido de Git y el panel local lo lee desde la
carpeta del proyecto Node configurada como `repo` en `config.json` cada cuatro
segundos en la pestaña **ACTIVIDAD WEB**. No requiere cambios de esquema ni
migraciones SQL.

## Modales accesibles

El hook `useScrollLock` (en `src/utils/useScrollLock.ts`) se usa en todos los modales del sistema para evitar el scroll del fondo mientras el modal está abierto:

```ts
useScrollLock(isOpen);       // AddProductModal, AllCategoriesModal
useScrollLock(product !== null);  // EditProductModal, CategoryModal
```

Aplica `overflow: hidden` al `body` al montarse y lo restaura al desmontarse.

El hook `useDialogBehavior` (en `src/utils/useDialog.ts`) se combina en los 11 modales propios: `Escape` cierra, el foco entra al panel al abrir, cicla dentro con `Tab` y se restaura al cerrar. Los paneles llevan `role="dialog"`, `aria-modal="true"` y `aria-label`.

## Imágenes de productos

El sistema maneja imágenes en este orden de prioridad:

1. `Imagen` (columna BD) — URL web o imagen local en dataURL al crear/editar producto
2. `PRODUCT_IMAGES` (mapa fijo en `product.service.ts`) — imágenes por nombre de producto
3. `CATEGORY_IMAGES` (mapa por categoría) — fallback genérico
4. Imagen placeholder por defecto

## Pruebas

Batería automatizada API + BD: `scripts/smoke-lote2.mjs` (73 comprobaciones; requiere backend, MySQL, terminal interactiva y cuenta de acceso del equipo; solicita credenciales localmente, acepta el descargo solo para la sesión de prueba y limpia datos de prueba al finalizar). Crea y modifica pedidos, negocio, permisos, productos e información de prueba durante la ejecución: úsela solo contra una base de datos desechable aislada, nunca contra la base viva del demo.

```bash
npm test              # destructiva: solo backend y MySQL de pruebas aislados
npm run test:payments # pruebas unitarias de pagos/modelos; no modifica la BD
npm run test:catalog  # pruebas unitarias de categorías/unidades; no modifica la BD
npm run test:activity # pruebas unitarias del registro de actividad; no modifica la BD
npm run typecheck     # tsc --noEmit (strict + noUnusedLocals/Parameters)
```

## Despliegue

```bash
npm run build
```

El directorio `dist/` contiene los archivos estáticos listos para servir en cualquier hosting (Vercel, Netlify, GitHub Pages, servidor Apache/Nginx).
