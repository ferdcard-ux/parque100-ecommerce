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

# 2. Crear la base de datos (solo la primera vez)
mysql -u root -p < setup.sql

# 3. Terminal 1 — Backend API en http://localhost:3001
npm run server

# 4. Terminal 2 — Frontend en http://localhost:5173
npm run dev
```

> Si tu usuario root de MySQL tiene contraseña, edítala en `server/config/db.js`.

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
| Autenticación | `POST /auth/login`, `POST /auth/register` |
| Pedidos | `GET /orders`, `GET /orders/:id`, `POST /orders` |
| Pagos | `POST /payments/process` |

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`Docs/arquitectura.md`](Docs/arquitectura.md) | Arquitectura MVC, estructura y decisiones técnicas |
| [`Docs/manual-tecnico.md`](Docs/manual-tecnico.md) | Guía técnica: convenciones, estándares, despliegue |
| [`Docs/guia-uso.md`](Docs/guia-uso.md) | Manual de usuario: funcionalidades y rutas |
| [`Docs/CODING_STANDARDS.md`](Docs/CODING_STANDARDS.md) | Estándares de codificación obligatorios |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios del proyecto |
