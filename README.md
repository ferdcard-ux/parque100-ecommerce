# Tienda Parque 100

Plataforma web de comercio electrónico (full-stack) para la compra de productos frescos y de canasta familiar, desarrollada como proyecto estudiantil de ADSO.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript, Vite 6, Tailwind CSS 4, React Router 7 |
| Backend | Node.js + Express 5 |
| Base de datos | MySQL 8 / MariaDB 10.4+ (driver `mysql2/promise`) |

## Arquitectura MVC

### Frontend (`src/`)

- **`src/models/`** — Interfaces y tipos de datos del dominio
- **`src/services/`** — Capa de acceso a datos (peticiones HTTP a la API)
- **`src/controllers/`** — Hooks React con lógica de negocio
- **`src/views/`** — Páginas y componentes de presentación
- **`src/utils/`** — Utilidades puras y constantes

### Backend (`server/`)

- **`server/config/db.js`** — Pool de conexiones MySQL
- **`server/models/`** — Consultas SQL encapsuladas (única capa que toca la BD)
- **`server/controllers/`** — Lógica de negocio y respuestas HTTP
- **`server/routes/`** — Definición de endpoints REST bajo `/api`
- **`server/index.js`** — Bootstrap del servidor (puerto 3001)

Convenciones completas en [`Docs/CODING_STANDARDS.md`](Docs/CODING_STANDARDS.md).

## Requisitos

| Software | Versión |
|----------|---------|
| Node.js | 20+ |
| npm | 9+ |
| MySQL Server o MariaDB | 8.0+ / 10.4+ |

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Restaurar la BD (esquema + datos de prueba). Reemplaza las 9 tablas.
npm run db:restore

# 3. Terminal 1 — Backend API en http://localhost:3001
npm run server

# 4. Terminal 2 — Frontend en http://localhost:5173
npm run dev
```

> Si tu MySQL tiene otras credenciales o base, cópialas en un archivo `.env` (ver `.env.example`: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, además de `PORT`, `JWT_SECRET` y `CORS_ORIGIN`).
> Windows: si el cliente no está en `C:\Program Files\MySQL\MySQL Server 8.4\bin`, define `MYSQL_BIN` con su directorio `bin`.
> Linux/macOS: instala el cliente (`sudo apt install mysql-client`, o `mariadb-client`) y usa los mismos comandos; si el binario no está en el PATH, define `MYSQL_BIN` (p. ej. `MYSQL_BIN=/usr/local/mysql/bin npm run db:dump`). El script también acepta clientes MariaDB (`mariadb`/`mariadb-dump`).

### Acceso académico

El sitio está destinado exclusivamente a usuarios autorizados del equipo y
muestra un descargo obligatorio antes de habilitar la navegación y las API.
Primero se inicia sesión en `/access.html` con una cuenta creada desde el panel
local; después se acepta el descargo y, cuando corresponda, se inicia sesión
con una cuenta demo de tienda. Son identidades y sesiones independientes. No
hay registro público. La base privada `parque100_acceso` no se comparte en el
repositorio ni en los dumps de `parque100`. La administración de cuentas se
documenta internamente en el equipo.

### Sincronizar la base de datos entre equipos

Los datos del proyecto son ficticios y se comparten con los commits mediante el dump `.BD/parque100.sql`:

```bash
# Después de hacer cambios en la BD local, compártelos:
npm run db:dump
git add .BD/parque100.sql && git commit -m "chore(db): sincronizar datos"

# En el equipo del compañero, después de hacer pull:
npm run db:restore
```

- `db:dump` exporta `parque100` (esquema + datos) a `.BD/parque100.sql`.
- `db:restore` importa el archivo y **reemplaza** las tablas del proyecto por las del dump.
- Alternativa esquema-only para una BD nueva: `mysql -u root < setup.sql`.

### Credenciales de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Usuario | `usuario@ejemplo.com` | `12345678` |
| Administrador | `admin@parque100.com` | `admin123` |
| Domiciliario | `domiciliario@parque100.com` | `domiciliario123` |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo frontend (Vite) |
| `npm run server` | Servidor backend Express (:3001) |
| `npm run build` | Compila para producción (`dist/`) |
| `npm test` | Smoke API + BD (73 comprobaciones); requiere backend, MySQL, terminal interactiva y cuenta autorizada. Crea/modifica datos durante la ejecución: úselo solo contra una BD desechable aislada |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |
| `npm run test:payments` | Pruebas unitarias de pagos y pedidos, sin modificar la BD |

## API REST

Base URL: `http://localhost:3001/api`

| Recurso | Endpoints |
|---------|-----------|
| Productos | `GET/POST /products`, `GET/PUT/DELETE /products/:id` |
| Categorías | `GET /categories` |
| Acceso académico | `POST /site-access/login`, `GET /site-access/disclaimer/status`, `POST /site-access/disclaimer/accept` |
| Autenticación | `POST /auth/login`, `POST /auth/register` (deshabilitado), `POST /auth/recover` (503 hasta configurar recuperación verificada), `PUT /auth/password` |
| Usuarios | `GET /users`, `POST /users`, `PUT /users/:id/admin`, `PUT /users/:id/profile` (perfil propio), `DELETE /users/:id`, `GET/PUT /users/:id/permissions` (delegar `puede_cancelar`) |
| Datos de entrega de usuario | `GET /users/:id`, `PUT /users/:id` |
| Negocio | `GET /business`, `PUT /business` |
| Pedidos | `GET /orders` (`?items=1` incluye detalles), `GET /orders/:id`, `POST /orders` (total recalculado, estado `pendiente`), `PUT /orders/:id/status` (máquina de estados), `PUT /orders/:id/cancel` (con motivo) |
| Calificaciones | `GET /ratings`, `GET /ratings/resumen?producto=ID`, `POST /ratings`, `PUT /ratings/:id` (autor), `DELETE /ratings/:id` |
| Pagos | `GET /payments/mode`; con `PAYMENTS_MODE=demo`, `POST /payments/process` inicia un intento y `POST /payments/confirm` registra atómicamente transacción DEMO, pedido y descuento de inventario; `PUT /payments/:reference/cancel` cierra intentos pendientes. Sin cobros ni datos financieros; efectivo contra entrega disponible |
| Actividad del sitio | `POST /activity/interactions` recibe solo eventos permitidos de carrito, favoritos y cierre de sesión; el backend registra además operaciones de catálogo, pedidos, pagos y administración en un JSONL local rotado, sin credenciales ni cuerpos |

> Los endpoints de escritura y los datos ajenos requieren `Authorization: Bearer <JWT>` (se obtiene en `POST /auth/login`); el rol `admin` gestiona usuarios, productos, negocio y moderación.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`Docs/arquitectura.md`](Docs/arquitectura.md) | Arquitectura MVC, estructura y decisiones técnicas |
| [`Docs/manual-tecnico.md`](Docs/manual-tecnico.md) | Guía técnica: convenciones, estándares, despliegue |
| [`Docs/guia-despliegue.md`](Docs/guia-despliegue.md) | Guía de despliegue: servidor propio expuesto a Internet (Caddy + DuckDNS) |
| [`Docs/manual-usuario.md`](Docs/manual-usuario.md) | Manual de usuario completo: roles, flujo de compra, panel administrativo y FAQ |
| [`Docs/guia-uso.md`](Docs/guia-uso.md) | Guía rápida de uso: funcionalidades y rutas |
| [`Docs/CODING_STANDARDS.md`](Docs/CODING_STANDARDS.md) | Estándares de codificación obligatorios |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios del proyecto |

> Los documentos internos de auditoría y acceso académico no se publican en el repositorio.

## Herramientas externas

- **[panel-parque100](https://github.com/ferdcard-ux/panel-parque100)** — panel de escritorio opcional (Python/tkinter, portable) para detectar e instalar dependencias y levantar MySQL, backend y frontend sin usar terminales. Se mantiene en su propio repositorio y **no forma parte de este entregable**.
