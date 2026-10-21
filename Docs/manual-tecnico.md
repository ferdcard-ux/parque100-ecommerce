# Manual Técnico

## Requisitos del sistema

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js | 18+ |
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

## Base de datos

### Esquema

La base de datos `parque100` consta de 8 tablas: `categorias`, `productos`, `usuario`, `pedidos`, `detalle_pedido`, `negocio`, `permisos_usuario` y `calificaciones`.

La tabla `productos` incluye una columna `Imagen MEDIUMTEXT` opcional para almacenar URLs web o imagenes locales en dataURL al crear/editar productos desde el panel administrativo (el backend acepta cuerpos JSON de hasta 10 MB).

La tabla `usuario` exige `Correo` y `Telefono` únicos en todo el sistema (índices `UNIQUE`; el teléfono admite `NULL`); el registro, el alta/edición admin y el perfil propio devuelven 409 específico si ya existen.

Los pedidos se fechan en horario del servidor (fecha local, sin desfase UTC) y los cancelados no suman a las ventas: reportes calculan `Ventas totales` y `Ticket promedio` solo sobre pedidos no cancelados.

### Sincronización entre equipos

Los datos del proyecto son ficticios (creados para pruebas), por lo que el estado completo de la BD se comparte con los commits mediante el dump `.BD/parque100.sql`:

- **Exportar** (tras cambios en la BD local): `npm run db:dump` → guarda esquema + datos en `.BD/parque100.sql`; hay que commitear ese archivo.
- **Importar** (tras hacer pull): `npm run db:restore` → reemplaza las 8 tablas del proyecto por las del dump (idempotente).
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
| `GET /api/products/:id` | Producto por ID |
| `POST /api/products` | Crear producto (admin, validado) |
| `PUT /api/products/:id` | Actualizar producto (admin, validado; 404 si no existe) |
| `DELETE /api/products/:id` | Eliminar producto (admin; 409 si tiene pedidos) |
| `GET /api/categories` | Listar todas las categorías |
| `POST /api/auth/login` | Iniciar sesión (emite JWT) |
| `POST /api/auth/register` | Registrar usuario (nombre, correo y teléfono únicos; 409 si existen) |
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
| `POST /api/orders` | Crear pedido (total recalculado en servidor, estado `pendiente`) |
| `PUT /api/orders/:id/status` | Avanzar estado (staff; `pendiente → preparando → enviando → entregado`, 409 ante saltos/retrocesos) |
| `PUT /api/orders/:id/cancel` | Cancelar con motivo (devuelve stock; actor del token; 400 sin motivo, 409 si el estado no admite) |
| `GET /api/ratings` | Listar calificaciones (filtros `producto`, `pedido`, `usuario`) |
| `GET /api/ratings/resumen?producto=ID` | Promedio y total de un producto |
| `POST /api/ratings` | Calificar (sesión; compra/propiedad verificada, 409 duplicada) |
| `PUT /api/ratings/:id` | Editar reseña (solo el autor) |
| `DELETE /api/ratings/:id` | Eliminar calificación (admin) |
| `POST /api/payments/process` | 503 hasta integrar una pasarela real con verificacion server-to-server |

> Salvo lectura pública (catálogo, negocio, reseñas), los endpoints exigen `Authorization: Bearer <JWT>`; la escritura sensible y los datos ajenos exigen rol `admin` o staff según la ruta.

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

Batería automatizada API + BD: `scripts/smoke-lote2.mjs` (57 checks: negocio, permisos/roles, reglas de cancelación, reseñas con compra verificada, autorización 401/403, integridad del pedido y limpieza de datos de prueba).

```bash
npm test            # requiere backend en :3001 y MySQL local
npm run typecheck   # tsc --noEmit (strict + noUnusedLocals/Parameters)
```

## Despliegue

```bash
npm run build
```

El directorio `dist/` contiene los archivos estáticos listos para servir en cualquier hosting (Vercel, Netlify, GitHub Pages, servidor Apache/Nginx).
