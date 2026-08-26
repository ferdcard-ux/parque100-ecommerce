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
| View          | `src/views/`        | Páginas y componentes puros (sin lógica de datos) |

### Backend (`server/`) — MVC clásico

```
server/
├── config/db.js            # Pool de conexiones MySQL
├── models/                 # Capa Model: solo SQL
│   ├── product.model.js
│   ├── user.model.js
│   ├── category.model.js
│   └── order.model.js
├── controllers/            # Capa Controller: lógica + HTTP
└── routes/                 # Capa Router: mapeo endpoint -> controller
```

Reglas de dependencia: `routes → controllers → models → config`.
Nunca se ejecuta SQL fuera de `models/`, ni se importa un modelo desde una ruta.

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
