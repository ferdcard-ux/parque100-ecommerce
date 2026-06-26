# Arquitectura del Proyecto

## Patrón MVC adaptado a Frontend

El proyecto implementa una arquitectura **MVC (Modelo-Vista-Controlador)** adaptada al desarrollo frontend con React:

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
│  Capa de acceso a datos (mock actual, API en futuro)    │
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
│       ├── home/             # HeroBanner, CategoryGrid, etc.
│       ├── cart/             # CartItemCard, RecommendedList
│       ├── checkout/         # AddressForm, PaymentOptions, CardForm
│       ├── admin/            # AdminSidebar, ProductTable, etc.
│       ├── auth/             # LoginForm, RegisterForm
│       ├── shared/           # ProgressSteps, OrderSummary
│       ├── figma/            # ImageWithFallback
│       └── ui/               # shadcn/ui (Radix UI primitives)
│
├── utils/                    # Utilidades
│   ├── index.ts              # Re-exportaciones
│   ├── constants.ts          # Constantes globales
│   ├── formatters.ts         # Formateo de precios, tarjetas
│   └── validators.ts         # Validación de formularios
│
└── styles/                   # Estilos globales
    ├── index.css             # Punto de entrada CSS
    ├── tailwind.css          # Configuración Tailwind
    ├── theme.css             # Variables CSS del tema
    └── fonts.css             # Fuentes tipográficas
```

## Flujo de datos

1. El usuario interactúa con un **componente vista** (`views/`)
2. La vista llama a un **controlador** via contexto (`controllers/`)
3. El controlador ejecuta lógica de negocio y llama al **servicio** (`services/`)
4. El servicio accede a datos (mock o API) y retorna modelos tipados (`models/`)
5. El controlador actualiza su estado, lo que re-renderiza la vista

## Principios aplicados

- **Separación de responsabilidades**: cada capa tiene un propósito único
- **Inversión de dependencias**: las vistas dependen de controladores, no de servicios directamente
- **Abstracción de datos**: los servicios pueden reemplazarse (mock → API real) sin modificar otras capas
- **Tipado fuerte**: TypeScript estricto en todas las capas
- **Componentes atómicos**: vistas divididas en componentes pequeños y reutilizables
