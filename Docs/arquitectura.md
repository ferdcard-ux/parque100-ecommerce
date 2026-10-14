# Arquitectura del Proyecto

El proyecto implementa una arquitectura **MVC (Modelo-Vista-Controlador) full-stack**: un frontend React que consume una API REST servida por un backend Express con base de datos MySQL.

## Frontend — MVC en React (`src/`)

```
┌─────────────────────────────────────────────────────────┐
│                        views/                           │
│  Componentes de presentación (JSX) que renderizan UI    │
│  Dependen de: controllers/models                        │
└────────────────────┬────────────────────────────────────┘
                     │ consume
┌────────────────────▼────────────────────────────────────┐
│                     controllers/                         │
│  Hooks personalizados con lógica de negocio             │
│  Orquestan llamadas a services y exponen estado+acciones │
│  Dependen de: services/models                            │
└────────────────────┬────────────────────────────────────┘
                     │ utiliza
┌────────────────────▼────────────────────────────────────┐
│                      services/                           │
│  Capa de acceso a datos: peticiones HTTP (fetch)         │
│  contra la API REST del backend (:3001/api)              │
│  Abstracción intercambiable sin afectar controllers     │
│  Dependen de: models                                     │
└────────────────────┬────────────────────────────────────┘
                     │ define
┌────────────────────▼────────────────────────────────────┐
│                       models/                            │
│  Interfaces y tipos de TypeScript                        │
│  Contratos de datos compartidos en toda la app          │
└─────────────────────────────────────────────────────────┘
```

## Estructura de directorios

```
src/
├── main.tsx                  # Punto de entrada
├── App.tsx                   # Orquestador: contexto global + router
│
├── models/                   # Capa Modelo
│   ├── index.ts              # Re-exportaciones (+ `normalizeUserRole`)
│   ├── product.ts            # Producto, Categoría, Inventario
│   ├── cart.ts               # Item del carrito
│   ├── user.ts               # Usuario, autenticación y roles
│   ├── order.ts              # Pedido, dirección de entrega
│   ├── payment.ts            # Datos de pago
│   ├── business.ts           # Ficha del negocio
│   └── rating.ts             # Calificaciones y resenas
│
├── services/                 # Capa de acceso a datos
│   ├── index.ts              # Re-exportaciones
│   ├── api.ts                # URL base (`VITE_API_URL`) + token JWT (`Bearer`)
│   ├── product.service.ts    # CRUD de productos
│   ├── auth.service.ts       # Autenticación (login/register/recover)
│   ├── payment.service.ts    # Procesamiento de pagos
│   ├── order.service.ts      # Gestión de pedidos
│   ├── user.service.ts       # Usuarios, perfiles y permisos
│   ├── business.service.ts   # Ficha del negocio
│   └── rating.service.ts     # Calificaciones
│
├── controllers/              # Capa Controlador (única usada por las vistas)
│   ├── index.ts              # Re-exportaciones
│   ├── use-product-controller.ts
│   ├── use-catalog-controller.ts
│   ├── use-cart-controller.ts
│   ├── use-auth-controller.ts
│   ├── use-payment-controller.ts
│   ├── use-orders-controller.ts      # + `useOrderDetailController`
│   ├── use-admin-orders-controller.ts
│   ├── use-users-controller.ts
│   ├── use-user-delivery-controller.ts
│   ├── use-ratings-controller.ts
│   ├── use-favorites-controller.ts
│   └── use-business-controller.ts
│
├── views/                    # Capa Vista (solo controllers/models/utils)
│   ├── pages/                # Páginas completas (composición)
│   │   ├── HomePage.tsx, CatalogPage.tsx, ProductDetailPage.tsx
│   │   ├── CartPage.tsx, FavoritesPage.tsx
│   │   ├── LoginPage.tsx, RegisterPage.tsx, AccountPage.tsx, ProfilePage.tsx
│   │   ├── AddressPage.tsx, PaymentMethodPage.tsx, CardPaymentPage.tsx
│   │   ├── PaymentSuccessPage.tsx
│   │   ├── OrdersPage.tsx, OrderDetailPage.tsx
│   │   ├── AdminInventoryPage.tsx, AdminOrdersPage.tsx, AdminOrderDetailPage.tsx
│   │   ├── AdminPendingOrdersPage.tsx, AdminClientsPage.tsx, AdminDashboardPage.tsx
│   │   ├── AdminReportsPage.tsx, AdminSettingsPage.tsx
│   │   └── HelpPage.tsx, SitemapPage.tsx, TermsPage.tsx, PrivacyPage.tsx
│   └── components/           # Componentes atómicos
│       ├── layout/           # Navbar, Footer, RootLayout, UserNotifications
│       ├── home/             # HeroBanner, CategoryGrid, CategoryModal, AllCategoriesModal, etc.
│       ├── shop/             # product-card
│       ├── cart/             # CartItemCard, RecommendedList
│       ├── checkout/         # AddressForm, PaymentOptions, CardForm, checkout-steps/summary
│       ├── admin/            # AdminPageShell/Sidebar/Stats, ProductTable, Add/EditProductModal
│       ├── auth/             # LoginForm, RegisterForm
│       ├── ratings/          # review-card, review-form/product-modal
│       ├── shared/           # page-header, status-badge, cancel-order-modal, star-rating, etc.
│       └── figma/            # ImageWithFallback
│
├── utils/                    # Utilidades
│   ├── index.ts              # Re-exportaciones
│   ├── constants.ts          # Constantes globales
│   ├── formatters.ts         # Formateo de precios, tarjetas
│   ├── validators.ts         # Validación de formularios (+ `isSafeRedirectPath`)
│   ├── useScrollLock.ts      # Bloqueo de scroll del body en modales
│   └── useDialog.ts          # Escape, foco inicial, trampa y restauración de foco
│
└── styles/                   # Estilos globales
    ├── index.css             # Punto de entrada CSS
    ├── tailwind.css          # Configuración Tailwind
    ├── theme.css             # Variables CSS del tema
    └── fonts.css             # Fuentes tipográficas
```

## Backend — MVC en Express (`server/`)

```
server/
├── index.js                    # Bootstrap: middleware, montaje de routers, puerto 3001
│
├── config/
│   └── db.js                   # Pool MySQL (host/puerto/usuario/BD por entorno, `.env`)
│
├── middleware/
│   └── auth.js                 # JWT: `signToken`, `requireAuth`, `requireRole`, `requireSelfOrAdmin`
│
├── models/                     # Capa Modelo — única capa que ejecuta SQL
│   ├── product.model.js        # Consultas CRUD sobre productos
│   ├── category.model.js       # Consultas de categorías
│   ├── user.model.js           # Búsqueda/creación de usuarios (bcrypt en controladores)
│   ├── permission.model.js     # Permisos delegables (`puede_cancelar`)
│   ├── order.model.js          # Pedidos + detalle (transaccional, totales autoritativos)
│   ├── business.model.js       # Ficha del negocio
│   └── rating.model.js         # Calificaciones (compra verificada, autoría)
│
├── controllers/                # Capa Controlador — lógica de negocio y HTTP
│   ├── product.controller.js   # Listar, crear, editar, eliminar productos (validado)
│   ├── category.controller.js  # Listar categorías
│   ├── auth.controller.js      # Login / registro / recover neutro / cambio de clave (JWT + bcrypt)
│   ├── users.controller.js     # Gestión admin, perfil propio y datos de entrega
│   ├── order.controller.js     # Listado por rol, detalle, creación y cancelación (identidad del token)
│   ├── business.controller.js  # Ficha del negocio
│   ├── rating.controller.js    # Calificaciones (autor del token)
│   └── payment.controller.js   # Procesamiento simulado (tarjeta validada)
│
└── routes/                     # Capa de enrutamiento (routers delgados con autorización)
    ├── products.js             # /api/products (escritura: admin)
    ├── categories.js           # /api/categories
    ├── auth.js                 # /api/auth (con rate-limit)
    ├── users.js                # /api/users (admin o propio-según-ruta)
    ├── business.js             # /api/business (escritura: admin)
    ├── orders.js               # /api/orders (sesión; staff para estados)
    ├── ratings.js              # /api/ratings (escritura con sesión; borrado: admin)
    └── payments.js             # /api/payments (con sesión)
```

**Regla de dependencias del backend:** `routes → controllers → models → db`. Las rutas solo delegan (más middleware de sesión/rol); los controladores nunca ejecutan SQL; los modelos nunca conocen HTTP.

**Autenticación:** login/registro emiten JWT (`Authorization: Bearer`, 8 h por defecto); las contraseñas se guardan y comparan con bcrypt; la identidad (usuario/rol) siempre sale del token, nunca del cuerpo.

La creación de pedidos es **transaccional**: `beginTransaction` → validar stock (`FOR UPDATE`), recalcular totales con precios vigentes, insertar pedido e ítems → `commit`; ante cualquier error, `rollback` garantiza que no queden pedidos parciales.

## Flujo de datos

1. El usuario interactúa con un **componente vista** (`src/views/`)
2. La vista llama a un **controlador** via contexto (`src/controllers/`)
3. El controlador ejecuta lógica de negocio y llama al **servicio** (`src/services/`)
4. El servicio realiza una petición HTTP a la API REST (`http://localhost:3001/api`)
5. El router del backend delega en su **controlador** (`server/controllers/`)
6. El controlador invoca el **modelo** (`server/models/`), que ejecuta el SQL contra MySQL
7. La respuesta viaja de vuelta tipada y re-renderiza la vista

```
views → controllers → services ──HTTP──▶ routes → controllers → models ──SQL──▶ MySQL
```

## Principios aplicados

- **Separación de responsabilidades**: cada capa tiene un propósito único
- **Inversión de dependencias**: las vistas dependen de controladores, no de servicios directamente
- **Abstracción de datos**: los servicios pueden reemplazarse (mock → API real) sin modificar otras capas
- **Tipado fuerte**: TypeScript estricto en todas las capas
- **Componentes atómicos**: vistas divididas en componentes pequeños y reutilizables
