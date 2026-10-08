# Tienda Parque 100

Plataforma web de comercio electrónico (full-stack) para la compra de productos frescos y de canasta familiar, desarrollada como proyecto estudiantil de ADSO.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript, Vite 6, Tailwind CSS 4, shadcn/ui, React Router 7 |
| Backend | Node.js + Express 4 |
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
| Node.js | 18+ |
| npm | 9+ |
| MySQL Server o MariaDB | 8.0+ / 10.4+ |

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Restaurar la BD (esquema + datos de prueba). Reemplaza las 5 tablas.
npm run db:restore

# 3. Terminal 1 — Backend API en http://localhost:3001
npm run server

# 4. Terminal 2 — Frontend en http://localhost:5173
npm run dev
```

> Si tu usuario root de MySQL tiene contraseña, edítala en `server/config/db.js` (o define `MYSQL_PWD`).
> Si el cliente MySQL no está en `C:\Program Files\MySQL\MySQL Server 8.4\bin`, define `MYSQL_BIN` con su directorio `bin`.

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

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo frontend (Vite) |
| `npm run server` | Servidor backend Express (:3001) |
| `npm run build` | Compila para producción (`dist/`) |

## API REST

Base URL: `http://localhost:3001/api`

| Recurso | Endpoints |
|---------|-----------|
| Productos | `GET/POST /products`, `GET/PUT/DELETE /products/:id` |
| Categorías | `GET /categories` |
| Autenticación | `POST /auth/login`, `POST /auth/register` (correo y teléfono únicos, 409 si existen), `POST /auth/recover`, `PUT /auth/password` |
| Usuarios | `GET /users`, `POST /users`, `PUT /users/:id/admin`, `PUT /users/:id/profile` (perfil propio), `DELETE /users/:id` |
| Datos de entrega de usuario | `GET /users/:id`, `PUT /users/:id` |
| Pedidos | `GET /orders`, `GET /orders/:id`, `POST /orders`, `PUT /orders/:id/status`, `PUT /orders/:id/cancel` |
| Pagos | `POST /payments/process` |

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`Docs/arquitectura.md`](Docs/arquitectura.md) | Arquitectura MVC, estructura y decisiones técnicas |
| [`Docs/manual-tecnico.md`](Docs/manual-tecnico.md) | Guía técnica: convenciones, estándares, despliegue |
| [`Docs/guia-uso.md`](Docs/guia-uso.md) | Manual de usuario: funcionalidades y rutas |
| [`Docs/CODING_STANDARDS.md`](Docs/CODING_STANDARDS.md) | Estándares de codificación obligatorios |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios del proyecto |
