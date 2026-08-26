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
│   ├── index.ts              # Re-exportaciones
│   ├── product.ts            # Producto, Categoría, Inventario
│   ├── cart.ts               # Item del carrito
│   ├── user.ts               # Usuario, autenticación
│   ├── order.ts              # Pedido, dirección de entrega
│   └── payment.ts            # Datos de pago
│
├── services/                 # Capa de acceso a datos
│   ├── index.ts              # Re-exportaciones
│   ├── product.service.ts    # CRUD de productos
│   ├── auth.service.ts       # Autenticación (login/register)
│   ├── payment.service.ts    # Procesamiento de pagos
│   └── order.service.ts      # Gestión de pedidos
│
├── controllers/              # Capa Controlador
│   ├── index.ts              # Re-exportaciones
│   ├── use-product-controller.ts
│   ├── use-cart-controller.ts
│   ├── use-auth-controller.ts
│   └── use-payment-controller.ts
│
├── views/                    # Capa Vista
│   ├── pages/                # Páginas completas (composición)
│   │   ├── HomePage.tsx
│   │   ├── CartPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── AddressPage.tsx
│   │   ├── PaymentMethodPage.tsx
│   │   ├── CardPaymentPage.tsx
│   │   ├── PaymentSuccessPage.tsx
│   │   └── AdminInventoryPage.tsx
│   └── components/           # Componentes atómicos
│       ├── layout/           # Navbar, Footer, RootLayout
│       ├── home/             # HeroBanner, CategoryGrid, CategoryModal, AllCategoriesModal, etc.
│       ├── cart/             # CartItemCard, RecommendedList
│       ├── checkout/         # AddressForm, PaymentOptions, CardForm
│       ├── admin/            # AdminSidebar, ProductTable, AddProductModal, EditProductModal
│       ├── auth/             # LoginForm, RegisterForm
│       ├── shared/           # ProgressSteps, OrderSummary
│       ├── figma/            # ImageWithFallback
│       └── ui/               # shadcn/ui (Radix UI primitives)
│
├── utils/                    # Utilidades
│   ├── index.ts              # Re-exportaciones
│   ├── constants.ts          # Constantes globales
│   ├── formatters.ts         # Formateo de precios, tarjetas
│   ├── validators.ts         # Validación de formularios
│   └── useScrollLock.ts      # Hook para bloquear scroll del body en modales
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
│   └── db.js                   # Pool de conexiones MySQL (mysql2/promise)
│
├── models/                     # Capa Modelo — única capa que ejecuta SQL
│   ├── product.model.js        # Consultas CRUD sobre productos
│   ├── category.model.js       # Consultas de categorías
│   ├── user.model.js           # Búsqueda/creación de usuarios
│   └── order.model.js          # Pedidos + detalle (transaccional)
│
├── controllers/                # Capa Controlador — lógica de negocio y HTTP
│   ├── product.controller.js   # Listar, crear, editar, eliminar productos
│   ├── category.controller.js  # Listar categorías
│   ├── auth.controller.js      # Login / registro
│   ├── order.controller.js     # Consulta y creación de pedidos
│   └── payment.controller.js   # Procesamiento de pagos
│
└── routes/                     # Capa de enrutamiento (routers delgados)
    ├── products.js             # /api/products
    ├── categories.js           # /api/categories
    ├── auth.js                 # /api/auth
    ├── orders.js               # /api/orders
    └── payments.js             # /api/payments
```

**Regla de dependencias del backend:** `routes → controllers → models → db`. Las rutas solo delegan; los controladores nunca ejecutan SQL; los modelos nunca conocen HTTP.

La creación de pedidos es **transaccional**: `beginTransaction` → insertar pedido e ítems → `commit`; ante cualquier error, `rollback` garantiza que no queden pedidos parciales.

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
