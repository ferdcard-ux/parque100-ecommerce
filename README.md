# Tienda Parque 100

Plataforma web de comercio electrónico para la compra de productos frescos y de canasta familiar, desarrollada como proyecto estudiantil de ADSO.

## Tecnologías

- **Runtime:** Node.js 24+
- **Framework:** React 18 + TypeScript
- **Build:** Vite 6
- **Estilos:** Tailwind CSS 4 + shadcn/ui
- **Enrutamiento:** React Router 7

## Arquitectura

MVC adaptado a frontend:

- **`src/models/`** — Interfaces y tipos de datos
- **`src/services/`** — Capa de acceso a datos (abstracción intercambiable mock/API)
- **`src/controllers/`** — Hooks con lógica de negocio
- **`src/views/`** — Componentes de presentación y páginas
- **`src/utils/`** — Utilidades y constantes

## Inicio rápido

```bash
npm install
npm run dev
```

El servidor de desarrollo se abre en `http://localhost:5173`.

### Credenciales de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Usuario | `usuario@ejemplo.com` | `12345678` |
| Administrador | `admin@parque100.com` | `admin123` |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
