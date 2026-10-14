# Estándares de Codificación — Parque 100

Este documento define las convenciones obligatorias del código del proyecto.
Se apoya en los archivos `.editorconfig` y `.prettierrc` de la raíz.

## 1. Arquitectura (MVC)

### Frontend (`src/`) — MVC adaptado a React SPA

| Capa          | Carpeta             | Responsabilidad                                   |
| ------------- | ------------------- | ------------------------------------------------- |
| Model         | `src/models/`       | Tipos e interfaces del dominio                    |
| Service/DAO   | `src/services/`     | Acceso a datos vía API REST (`fetch`)             |
| Controller    | `src/controllers/`  | Hooks React con estado y lógica de presentación   |
| View          | `src/views/`        | Páginas y componentes (solo controllers/models/utils; sin `services`) |

### Backend (`server/`) — MVC clásico

```
server/
├── config/db.js            # Pool de conexiones MySQL (por entorno)
├── middleware/auth.js      # JWT: signToken, requireAuth, requireRole, requireSelfOrAdmin
├── models/                 # Capa Model: solo SQL
│   ├── product.model.js
│   ├── category.model.js
│   ├── user.model.js
│   ├── permission.model.js
│   ├── order.model.js
│   ├── business.model.js
│   └── rating.model.js
├── controllers/            # Capa Controller: lógica + HTTP (+bcrypt, validación)
│   ├── product.controller.js
│   ├── category.controller.js
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── order.controller.js
│   ├── business.controller.js
│   ├── rating.controller.js
│   └── payment.controller.js
└── routes/                 # Capa Router: mapeo endpoint -> controller (+autorización)
    ├── products.js         # /api/products
    ├── categories.js       # /api/categories
    ├── auth.js             # /api/auth (rate-limit)
    ├── users.js            # /api/users
    ├── business.js         # /api/business
    ├── orders.js           # /api/orders
    ├── ratings.js          # /api/ratings
    └── payments.js         # /api/payments
```

Reglas de dependencia: `routes → controllers → models → config`.
Nunca se ejecuta SQL fuera de `models/`, ni se importa un modelo desde una ruta.
La identidad (usuario/rol) sale del JWT (`req.user`); los cuerpos nunca otorgan permisos.

## 2. Formato

- UTF-8, fin de línea LF, 2 espacios de indentación, sin tabs.
- Comillas simples; punto y coma siempre; ancho máximo 100 columnas.
- Trailing commas en multilínea (ver `.prettierrc`).

## 3. Nomenclatura

| Elemento                | Convención      | Ejemplo                  |
| ----------------------- | --------------- | ------------------------ |
| Variables / funciones   | camelCase       | `calculateShipping`      |
| Componentes / tipos     | PascalCase      | `FeaturedProducts`       |
| Constantes globales     | UPPER_SNAKE     | `FREE_SHIPPING_THRESHOLD`|
| Archivos backend JS     | kebab-case      | `product.controller.js`  |
| Archivos frontend TS(X) | kebab-case      | `use-cart-controller.ts` |
| Columnas BD (en código) | tal cual la BD  | `ID_Producto`, `Precio_Venta` |

## 4. JavaScript / TypeScript

- Módulos ES (`import/export`), nunca `require`.
- `async/await`; prohibido mezclar promesas con callbacks.
- Consultas SQL **siempre parametrizadas** (`?`) — jamás concatenar strings.
- Errores HTTP centralizados en controladores con `try/catch`.
- TypeScript: tipos explícitos en funciones exportadas.

## 5. Documentación

- Todo archivo inicia con un comentario `@fileoverview` que explica su propósito.
- Toda clase, función o método exportado lleva JSDoc con descripción,
  parámetros (`@param`) y retorno (`@returns`) cuando aplique.
- Los comentarios se escriben en español, sin tildes en identificadores.

## 6. Git

- Un módulo por commit; mensajes imperativos en español.
- Nunca commitear credenciales reales ni `node_modules`.

## 7. Diseño responsive (mobile-first)

Matriz de prueba obligatoria: **360×740** (móvil), **768×1024** (tableta),
**1024×768** (portátil), **1440×900** (escritorio). A 360px ninguna ruta debe producir scroll
horizontal de página (`document.documentElement.scrollWidth <= innerWidth`).

- Grillas con `grid-cols-1` base y escalado `sm:`/`lg:`; 1 columna bajo 380px
  (`max-[380px]:grid-cols-1`) en tarjetas de producto.
- Tablas admin: reflow a tarjetas en `<sm` (`sm:hidden`); tabla con scroll
  interno desde `sm:`.
- Touch: área mínima 44px en botones de acción (área extendida con
  `before:-inset` si el visual es menor); favoritos siempre visibles en táctil
  (sin depender de `hover`).
- Tipografía en `rem` con raíz fluida (`tailwind.css`); respetar
  `prefers-reduced-motion` (ya global en CSS).
- Imágenes de Unsplash y Pexels con `srcSet` de anchos responsivos y `sizes`
  según el layout; reservar la proporción del contenedor para evitar saltos.
- Carruseles con arrastre táctil (Embla) y flechas de 44px con estado
  `disabled`.
