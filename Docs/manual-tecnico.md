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
mysql -u root < scripts_dev/setup.sql

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

La base de datos `parque100` consta de 5 tablas: `categorias`, `productos`, `usuario`, `pedidos`, `detalle_pedido`.

La tabla `productos` incluye una columna `Imagen MEDIUMTEXT` opcional para almacenar URLs web o imagenes locales en dataURL al crear/editar productos desde el panel administrativo (el backend acepta cuerpos JSON de hasta 10 MB).

La tabla `usuario` exige `Correo` y `Telefono` únicos en todo el sistema (índices `UNIQUE`; el teléfono admite `NULL`); el registro, el alta/edición admin y el perfil propio devuelven 409 específico si ya existen.

Los pedidos se fechan en horario del servidor (fecha local, sin desfase UTC) y los cancelados no suman a las ventas: reportes calculan `Ventas totales` y `Ticket promedio` solo sobre pedidos no cancelados.

### Sincronización entre equipos

Los datos del proyecto son ficticios (creados para pruebas), por lo que el estado completo de la BD se comparte con los commits mediante el dump `.BD/parque100.sql`:

- **Exportar** (tras cambios en la BD local): `npm run db:dump` → guarda esquema + datos en `.BD/parque100.sql`; hay que commitear ese archivo.
- **Importar** (tras hacer pull): `npm run db:restore` → reemplaza las 5 tablas del proyecto por las del dump (idempotente).
- Ambos comandos (`scripts/db.mjs`) son multi-entorno (Windows, Linux, macOS) y localizan el cliente MySQL o MariaDB así: `MYSQL_BIN` → rutas por defecto de la plataforma (`C:\Program Files\MySQL\MySQL Server 8.4\bin`, `/usr/bin`, `/usr/local/bin`, `/usr/local/mysql/bin`, `/opt/homebrew/bin`) → `mysql`/`mysqldump` o `mariadb`/`mariadb-dump` en el PATH. Autenticación `root` sin contraseña, o `MYSQL_PWD` / `DB_USER`.
- Para una BD nueva sin datos compartidos basta el esquema de `setup.sql`.

### Conexión

Archivo `server/config/db.js` — pool de conexiones MySQL con `mysql2/promise`:

```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',        // Cambiar si root tiene contraseña
  database: 'parque100',
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
| `POST /api/products` | Crear producto |
| `PUT /api/products/:id` | Actualizar producto |
| `DELETE /api/products/:id` | Eliminar producto |
| `GET /api/categories` | Listar todas las categorías |
| `POST /api/auth/login` | Iniciar sesión |
| `POST /api/auth/register` | Registrar usuario (nombre, correo y teléfono únicos; 409 si existen) |
| `POST /api/auth/recover` | Generar clave temporal para un correo |
| `PUT /api/auth/password` | Cambiar contraseña (valida la actual) |
| `GET /api/users` | Listar usuarios registrados |
| `POST /api/users` | Crear usuario desde el panel admin |
| `PUT /api/users/:id/admin` | Editar nombre, correo, rol y teléfono |
| `PUT /api/users/:id/profile` | Editar perfil propio (nombre, correo, teléfono; 409 si existen) |
| `DELETE /api/users/:id` | Eliminar usuario sin pedidos (409 si tiene) |
| `GET /api/users/:id` | Consultar datos de entrega del usuario |
| `PUT /api/users/:id` | Actualizar teléfono, torre/bloque, piso y apartamento |
| `GET /api/orders` | Listar pedidos |
| `GET /api/orders/:id` | Detalle de pedido con sus líneas |
| `POST /api/orders` | Crear pedido (con snapshot de entrega y pago) |
| `PUT /api/orders/:id/status` | Cambiar estado (pendiente, preparando, enviando, entregado; 409 al reanudar un cancelado) |
| `PUT /api/orders/:id/cancel` | Cancelar con motivo (devuelve stock; 400 sin motivo, 409 si el estado no admite) |
| `POST /api/payments/process` | Procesar pago |

## Scroll Lock en modales

El hook `useScrollLock` (en `src/utils/useScrollLock.ts`) se usa en todos los modales del sistema para evitar el scroll del fondo mientras el modal está abierto:

```ts
useScrollLock(isOpen);       // AddProductModal, AllCategoriesModal
useScrollLock(product !== null);  // EditProductModal, CategoryModal
```

Aplica `overflow: hidden` al `body` al montarse y lo restaura al desmontarse.

## Imágenes de productos

El sistema maneja imágenes en este orden de prioridad:

1. `Imagen` (columna BD) — URL web o imagen local en dataURL al crear/editar producto
2. `PRODUCT_IMAGES` (mapa fijo en `product.service.ts`) — imágenes por nombre de producto
3. `CATEGORY_IMAGES` (mapa por categoría) — fallback genérico
4. Imagen placeholder por defecto

## Pruebas

Actualmente el proyecto no cuenta con pruebas automatizadas.

Para agregarlas, se recomienda:

```bash
npm install --save-dev vitest @testing-library/react
```

## Despliegue

```bash
npm run build
```

El directorio `dist/` contiene los archivos estáticos listos para servir en cualquier hosting (Vercel, Netlify, GitHub Pages, servidor Apache/Nginx).
