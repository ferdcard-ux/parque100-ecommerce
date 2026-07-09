# Bitácora del Desarrollador — Parque 100

> **Uso exclusivo del desarrollador.** Registro técnico completo de decisiones, problemas, soluciones, cambios y convenciones del proyecto.

---

## 1. Historial de sesiones

### Sesión 1 — 26/06/2026
**Objetivo:** Reestructurar maqueta Figma a código funcional con arquitectura MVC.

#### Problemas encontrados

| # | Problema | Síntoma | Causa | Solución |
|---|----------|---------|-------|----------|
| 1 | `ReferenceError: onLogout is not defined` | La app no cargaba | `RootLayout` y `Navbar` referenciaban `onLogout` como prop que nunca se pasaba | Eliminar prop `onLogout` de ambos componentes; el logout se maneja internamente en `useAuthController` |
| 2 | Router se recreaba en cada render | Pérdida de rendimiento, warning de React Router | `createBrowserRouter` se llamaba directamente en el cuerpo del componente `App` | Envolver en `useMemo([])` con array de dependencias vacío |
| 3 | Duplicación de estilos Tailwind | Conflictos de clases | Existían `src/styles/globals.css` (shadcn legacy) y `src/styles/index.css` coexistiendo | Eliminar `globals.css`, unificar en `index.css` que importa `tailwind.css` y `theme.css` |
| 4 | `pnpm-workspace.yaml` sin propósito | Archivo huérfano del template | No se usa pnpm ni monorepo | Eliminar |
| 5 | `dist/` comiteado | Ruido en el repo | Build previo sin `.gitignore` | Agregar `dist/` al `.gitignore` |
| 6 | `guidelines/` con documentos genéricos | Contenido irrelevante (guías de Tailwind, shadcn, etc.) | Template o copia de otro proyecto | Eliminar carpeta completa |
| 7 | `postcss.config.mjs` duplicado | Confusión de configuración | Tailwind v4 ya no necesita PostCSS | Eliminar; la config vive en `vite.config.ts` |

#### Decisiones técnicas

- **Arquitectura:** MVC adaptado a frontend:
  - `models/` — Tipos e interfaces (TypeScript)
  - `services/` — Lógica de datos (intercambiable mock ↔ API)
  - `controllers/` — Hooks de React con estado y efectos
  - `views/` — Componentes de presentación (páginas y componentes atómicos)
  - `utils/` — Funciones puras (constantes, formatos, validadores)
- **Enrutamiento:** `createBrowserRouter` con layout anidado (`RootLayout`)
- **Estado global:** Contexto React (`AppContext`) con `useReducer`
- **Estilos:** Tailwind CSS v4 + shadcn/ui (componentes base en `views/components/ui/`)
- **Mock data:** Servicios implementan interfaces idénticas a las que usaría una API real

#### Dependencias instaladas

```
react, react-dom, react-router-dom
@radix-ui/* (13+ paquetes para componentes shadcn)
lucide-react (iconos)
tailwind-merge, clsx, class-variance-authority (utilerías CSS)
recharts (gráficas admin)
framer-motion (animaciones) → migrado a motion
sonner (notificaciones)
date-fns (fechas)
```

#### Convenciones de nomenclatura

| Contexto | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `HeroBanner`, `CartItemCard` |
| Hooks/controladores | camelCase con prefijo `use` | `useAuthController`, `useCartController` |
| Servicios | camelCase con sufijo `.service` | `auth.service.ts`, `product.service.ts` |
| Modelos | camelCase | `product.ts`, `user.ts` |
| Utilidades | camelCase | `formatters.ts`, `validators.ts` |
| Archivos de página | PascalCase + sufijo `Page` | `HomePage.tsx`, `LoginPage.tsx` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL`, `PAYMENT_STEPS` |
| Directorios | kebab-case | `views/components/checkout/` |
| Componentes shadcn | kebab-case | `button.tsx`, `dialog.tsx` |

---

### Sesión 2 — 26/06/2026
**Objetivo:** Autenticar Git, configurar identidad, crear repositorio en GitHub y subir código.

#### Cambios realizados

| # | Acción | Detalle |
|---|--------|---------|
| 1 | Agregar Git al PATH | `C:\Program Files\Git\bin` y `C:\Program Files\Git\cmd` agregados al PATH del sistema |
| 2 | Configurar identidad Git | `user.name=ferdcard-ux`, `user.email=ferdcard@gmail.com` |
| 3 | Instalar GitHub CLI | `gh` versión 2.95.0 instalado via `winget` |
| 4 | Autenticar en GitHub | Token de acceso personal (PAT) con scopes `repo`, `read:org`, `workflow` |
| 5 | Crear repositorio | `gh repo create parque100-ecommerce --private --source=. --remote=origin --push` |
| 6 | Commit inicial | `654dcd8` — 116 archivos, 13811 inserciones |
| 7 | Corregir autor del commit | Se usó `git commit --amend --author` + `GIT_COMMITTER_NAME` para cambiar de "ADSO Student" a "ferdcard-ux" |
| 8 | Force push | `git push --force-with-lease origin master` tras cada enmienda |

#### Observaciones

- El commit original aparecía con autor `ADSO Student <estudiante@adso.edu.co>` y committer `ADSO Student`. Se necesitaron dos correcciones: primero el `--author` (solo cambiaba Author), luego con `GIT_COMMITTER_NAME` y `GIT_COMMITTER_EMAIL` para cambiar también Committer.
- El commit final corrigió ambos campos a `ferdcard-ux <ferdcard@gmail.com>`.

---

### Sesión 3 — 26/06/2026
**Objetivo:** Sincronizar repositorio local con remoto tras cambios de rama (master → main) y visibilidad (privado → público), y recibir cambios de compañeros.

#### Cambios realizados

| # | Cambio | Antes | Después |
|---|--------|-------|---------|
| 1 | Visibilidad del repo | Privado | Público |
| 2 | Rama por defecto (remoto) | `master` | `main` |
| 3 | Rama local | `master` | `main` (renombrada con `git branch -m master main`) |
| 4 | Remote tracking | `origin/master` | `origin/main` |
| 5 | HEAD remoto | — | `origin/main` configurado con `git remote set-head origin main` |

#### Commits incorporados de compañeros

| Hash | Mensaje |
|------|---------|
| `d89c72a` | Corrige texto en sección de confirmación de pago |
| `0d2d4c9` | Fix typo in payment confirmation section |
| `1a8f766` | Añadido la conexión con la base de datos |
| `d58f298` | Renombrado archivo de conexión a la base de datos |

#### Archivos nuevos recibidos

- `connection.js` — Conexión a MySQL usando `mysql` (paquete antiguo)
- `.BD/parque100 (1).sql` — Dump de la base de datos (estructura sin datos)
- Modificaciones en `Docs/guia-uso.md`

---

### Sesión 4 — 01/07/2026
**Objetivo:** Vincular base de datos MySQL al proyecto usando `connection.js`.

#### Problemas encontrados con MySQL

| # | Problema | Intento de solución | Resultado |
|---|----------|---------------------|-----------|
| 1 | `ERROR 1045: Access denied for user 'root'@'localhost' (using password: NO)` | El `connection.js` usaba `password: ''` pero MySQL 8.4 tenía password configurado | Falló |
| 2 | `Stop-Service` no funciona | PowerShell sin privilegios de administrador | Falló |
| 3 | `taskkill /F /IM mysqld.exe` denegado | Los procesos mysqld corrían bajo cuenta SYSTEM | Falló |
| 4 | `start /B mysqld --skip-grant-tables` no arrancaba | El puerto 3306 ya estaba en uso por el servicio | Falló |
| 5 | v1: `--skip-grant-tables --skip-networking` | `--skip-networking` deshabilita TCP; no se podía conectar | Falló |
| 6 | v2: `--skip-grant-tables` sin `--skip-networking` | mysqld no arrancó (data dir bloqueado) | Falló |
| 7 | v3: Modificar `my.ini` con `skip-grant-tables` | Se agregó en sección `[client]` en vez de `[mysqld]` | Falló |
| 8 | v4: Agregar `skip-grant-tables` en `[mysqld]` + `shared-memory` | MySQL arranca con `port: 0` y exige TCP/IP, shared-memory o named pipe en NT | Falló |
| 9 | `--init-file` agregado en `[client]` (no en `[mysqld]`) | No se ejecutó porque estaba en la sección incorrecta | Falló |
| 10 | `--init-file` en `[mysqld]` | **Funcionó.** El servicio ejecutó `ALTER USER 'root'@'localhost' IDENTIFIED BY '';` al iniciar | Éxito |

#### Solución final del password root

**Método que funcionó:** `init-file`

1. Se creó `C:\Users\FERNAN~1\AppData\Local\Temp\r.sql` con: `ALTER USER 'root'@'localhost' IDENTIFIED BY '';`
2. Se agregó `init-file="C:/Users/FERNAN~1/AppData/Local/Temp/r.sql"` bajo `[mysqld]` en `my.ini`
3. Se reinició el servicio MySQL84 con `net stop` + `net start`
4. MySQL ejecutó el SQL al arrancar, reseteando el password a vacío
5. Se eliminó la línea `init-file` de `my.ini`
6. Se reinició el servicio nuevamente
7. Verificación: `mysql -u root -e "SELECT 'CONEXION EXITOSA' AS resultado;"` → Éxito

**Archivos creados para recovery:**
- `scripts_dev/mysql-reset-password.bat` — v1 (fallido)
- `scripts_dev/mysql-reset-v2.bat` — v2 (fallido)
- `scripts_dev/mysql-reset-v3.bat` — init-file (falló por sección incorrecta)
- `scripts_dev/mysql-reset-v4.bat` — skip-grant-tables + shared-memory (falló)
- `scripts_dev/fix-mysql-final.bat` — intento final con init-file
- `scripts_dev/mysql-reset-initfile.bat` — versión funcional

#### Importación de la base de datos

- Se creó la BD `parque100` con `CREATE DATABASE IF NOT EXISTS`
- Se importó `.BD/parque100.sql` usando `cmd /c "mysql -u root parque100 < archivo.sql"` (PowerShell no soporta `<`)
- 5 tablas creadas: `categorias`, `detalle_pedido`, `pedidos`, `productos`, `usuario`
- Sin datos iniciales (solo estructura)

#### Inserción de datos de prueba

Se creó `seed.sql` con:

- **8 categorías:** Verduras, Frutas, Carnes, Granos, Lacteos, Panaderia, Bebidas, Limpieza
- **10 productos:** Tomates Cherry, Bananos, Fresas, Canasta Frutas, Verduras Mixtas, Manzanas Rojas, Surtido Verduras, Mix Frutas Tropicales, Leche Entera, Pan Tajado
- **2 usuarios:**
  - `usuario@ejemplo.com` / `12345678` (Rol: usuario)
  - `admin@parque100.com` / `admin123` (Rol: admin)

**Problema:** El campo `Telefono` es `INT(20)` y los números colombianos (3001234567) exceden el rango de INT (max 2147483647). Se corrigió usando números más pequeños (1234567, 9876543).

**Problema:** `INSERT` duplicado tras reintento. Se usó `TRUNCATE` + `INSERT` en lugar de `INSERT IGNORE`.

---

### Sesión 5 — 01/07/2026
**Objetivo:** Crear servidor backend Express, migrar servicios mock a llamadas API reales y verificar integración.

#### Creación del backend

Se creó la carpeta `server/` con la siguiente estructura:

```
server/
├── index.js                    # Servidor Express, puerto 3001, CORS habilitado
└── routes/
    ├── products.js             # CRUD completo de productos
    │   ├── GET    /api/products        → Listar todos con categoría
    │   ├── GET    /api/products/:id    → Producto por ID
    │   ├── POST   /api/products        → Crear
    │   ├── PUT    /api/products/:id    → Actualizar
    │   └── DELETE /api/products/:id    → Eliminar
    ├── auth.js                 # Autenticación
    │   ├── POST /api/auth/login       → Validar credenciales
    │   └── POST /api/auth/register    → Registrar usuario nuevo
    ├── orders.js               # Pedidos
    │   ├── GET    /api/orders         → Listar pedidos
    │   ├── GET    /api/orders/:id     → Pedido + detalle
    │   └── POST   /api/orders         → Crear pedido con detalle
    └── payments.js             # Pagos (mock con simulación)
        └── POST /api/payments/process → Procesar pago (90% éxito)
```

#### Dependencias backend instaladas

```
mysql2@3.x            → Driver MySQL con promesas (reemplaza al antiguo mysql)
express@4.x           → Servidor HTTP
cors@2.x              → Middleware CORS para peticiones cross-origin
```

#### Actualización de `connection.js`

Se reescribió completamente:
- **Antes:** Usaba `mysql` (callback-based) y llamaba a `process.exit()` tras conectar — inservible como módulo
- **Ahora:** Usa `mysql2/promise` con pool de conexiones (10 conexiones simultáneas), exporta el pool para ser usado por los routes

#### Migración de servicios (mock → API)

| Servicio | Antes | Ahora |
|----------|-------|-------|
| `product.service.ts` | Array fijo `MOCK_PRODUCTS` con 8 productos, `MOCK_CATEGORIES` con 8 categorías | `fetch()` a `http://localhost:3001/api/products`, mapea de columnas DB a camelCase |
| `auth.service.ts` | Validación local con 2 credenciales hardcodeadas | `fetch()` a `http://localhost:3001/api/auth/login` y `/register`, mapea `Nombre` → `firstName/lastName`, `Rol` → `isAdmin` |
| `payment.service.ts` | Mock local con `setTimeout` | `fetch()` a `http://localhost:3001/api/payments/process` para pagos con tarjeta |
| `order.service.ts` | Mock local en array `MOCK_ORDERS` | Persiste pedidos vía `POST /api/orders` (fallback a memoria si falla API) |

#### Mapeo de datos DB → Frontend

| DB (MySQL) | Frontend (modelo TS) | Servicio |
|------------|---------------------|----------|
| `ID_Producto` | `id` | product.service |
| `Nombre` | `name` | product.service / auth.service → `firstName + lastName` |
| `Precio_Venta` | `price` | product.service |
| `Stock_Minimo` | `stock` / `quantity` | product.service |
| `Nombre_Categoria` | `category` | product.service |
| `Correo` | `email` | auth.service |
| `Rol` | `isAdmin` (boolean) | auth.service |

#### Actualización de `package.json`

Se agregó script: `"server": "node server/index.js"`

#### Verificación de build

```
npm run build → 1651 modules transformed, 0 errores
dist/
├── index.html              (0.79 kB)
├── assets/index-CEcYaQLC.css  (108 kB)
└── assets/index-BS7HGegb.js   (333 kB)
```

#### Actualización del script `iniciar-proyecto.ps1`

Se agregó:
- Verificación de MySQL antes de arrancar
- Inicio automático del backend (`node server/index.js`) como job en background
- Mensajes informativos con las URLs de frontend, backend y MySQL

---

### Sesión 6 — 01/07/2026
**Objetivo:** Documentar cambios en bitácora y scripts de empaquetado/automatización.

#### Archivos modificados/creados

- `Docs/bitacora-desarrollador.md` — Esta bitácora (actualización completa)
- `scripts_dev/empacar-proyecto.ps1` — Se actualizó para incluir `server/` y `connection.js`
- `scripts_dev/iniciar-proyecto.ps1` — Se actualizó con soporte para backend + MySQL

---

## 2. Estructura actual del proyecto

```
New_P100-Figma/
├── .BD/
│   └── parque100.sql              # Plantilla de estructura BD (NO se modifica)
├── .gitignore
├── ATTRIBUTIONS.md
├── Docs/
│   ├── index.md
│   ├── arquitectura.md
│   ├── manual-tecnico.md
│   ├── guia-uso.md
│   └── bitacora-desarrollador.md   # ← Este archivo
├── README.md
├── connection.js                   # Pool de conexión MySQL (mysql2/promise)
├── index.html
├── package-lock.json
├── package.json
├── server/                         # Backend Express
│   ├── index.js
│   └── routes/
│       ├── products.js
│       ├── categories.js          # GET /api/categories
│       ├── auth.js
│       ├── orders.js
│       └── payments.js
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── controllers/
│   │   ├── index.ts
│   │   ├── use-auth-controller.ts
│   │   ├── use-cart-controller.ts
│   │   ├── use-payment-controller.ts
│   │   └── use-product-controller.ts
│   ├── models/
│   │   ├── cart.ts
│   │   ├── index.ts
│   │   ├── order.ts
│   │   ├── payment.ts
│   │   ├── product.ts
│   │   └── user.ts
│   ├── services/
│   │   ├── auth.service.ts         # API real (fetch)
│   │   ├── index.ts
│   │   ├── order.service.ts        # API real (fetch) + fallback
│   │   ├── payment.service.ts      # API real (fetch)
│   │   └── product.service.ts      # API real (fetch)
│   ├── styles/
│   │   ├── fonts.css
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── theme.css
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   ├── index.ts
│   │   ├── useScrollLock.ts       # Hook para bloquear scroll en modales
│   │   └── validators.ts
│   └── views/
│       ├── components/
│       │   ├── admin/              # AddProductModal, EditProductModal, AdminSidebar, AdminStats, ProductTable
│       │   ├── auth/               # LoginForm, RegisterForm
│       │   ├── cart/               # CartItemCard, RecommendedList
│       │   ├── checkout/           # AddressForm, CardForm, PaymentOptions
│       │   ├── figma/              # ImageWithFallback
│       │   ├── home/               # AllCategoriesModal, CategoryGrid, CategoryModal, FeaturedProducts, HeroBanner, PromoBanner, TrustBar
│       │   ├── layout/             # Footer, Navbar, RootLayout
│       │   ├── shared/             # OrderSummary, ProgressSteps
│       │   └── ui/                 # ~40 componentes shadcn
│       └── pages/
│           ├── AddressPage.tsx
│           ├── AdminInventoryPage.tsx
│           ├── CardPaymentPage.tsx
│           ├── CartPage.tsx
│           ├── HomePage.tsx
│           ├── LoginPage.tsx
│           ├── PaymentMethodPage.tsx
│           ├── PaymentSuccessPage.tsx
│           └── RegisterPage.tsx
├── vite.config.ts
└── scripts_dev/                    # Scripts exclusivos del desarrollador (NO incluidos en .zip de entrega)
    ├── empacar-proyecto.ps1
    ├── empacar-proyecto.bat
    ├── iniciar-proyecto.ps1
    └── iniciar-proyecto.bat
```

---

## 3. Base de datos — Esquema completo

```
parque100 (MySQL 8.4.9 | MariaDB 10.4.32 compatible)
├── categorias
│   ├── ID_Categoria      INT(255) PK AUTO_INCREMENT
│   ├── Nombre_Categoria  VARCHAR(30) NOT NULL
│   └── Descripcion       VARCHAR(30) NULL
│
├── productos
│   ├── ID_Producto       VARCHAR(30) PK
│   ├── Nombre            VARCHAR(50) NULL
│   ├── Descripcion       VARCHAR(255) NULL
│   ├── Imagen            VARCHAR(500) NULL   ← URL personalizada del producto
│   ├── Precio_Venta      INT(20) NULL
│   ├── Stock_Minimo      INT(30) NULL
│   └── ID_Categoria      INT(11) FK → categorias.ID_Categoria
│
├── usuario
│   ├── ID_Usuario        INT(11) PK AUTO_INCREMENT
│   ├── Nombre            VARCHAR(30) NOT NULL
│   ├── Correo            VARCHAR(50) NOT NULL UNIQUE
│   ├── Contrasena        VARCHAR(30) NOT NULL
│   ├── Rol               VARCHAR(20) NULL ('usuario' | 'admin')
│   ├── Telefono          INT(20) NULL
│   └── Direccion         VARCHAR(20) NOT NULL
│
├── pedidos
│   ├── ID_Pedido         INT(255) PK AUTO_INCREMENT
│   ├── Fecha             DATE NULL
│   ├── Estado            VARCHAR(20) NULL
│   ├── Total             INT(20) NULL
│   ├── Tipo_Entrega      VARCHAR(20) NULL
│   └── ID_Usuario        INT(255) FK → usuario.ID_Usuario
│
└── detalle_pedido
    ├── ID_Detalle        INT(255) PK AUTO_INCREMENT
    ├── ID_Pedido         INT(255) FK → pedidos.ID_Pedido
    ├── ID_Producto       VARCHAR(30) FK → productos.ID_Producto
    ├── Cantidad          INT(20) NULL
    └── Subtotal          INT(30) NULL
```

### Ubicación física de los datos

```
C:\Users\Fernando Cardenas\mysql\data\parque100\
  ├── categorias.ibd
  ├── productos.ibd
  ├── usuario.ibd
  ├── pedidos.ibd
  └── detalle_pedido.ibd
```

Archivos binarios InnoDB. No se modifican archivos del proyecto ni el `.sql`.

### Datos de prueba insertados

**Usuarios:**
| Nombre | Email | Contraseña | Rol |
|--------|-------|-----------|-----|
| Usuario Demo | usuario@ejemplo.com | 12345678 | usuario |
| Admin Parque100 | admin@parque100.com | admin123 | admin |

**Productos:** 10 productos en 2 categorías (Verduras, Frutas, Lacteos, Panaderia).
**Categorías:** 8 registros.

---

## 4. API REST — Endpoints

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/products` | — | Array de productos con categoría |
| GET | `/api/products/:id` | — | Un producto o 404 |
| POST | `/api/products` | `{ID_Producto, Nombre, Descripcion, Imagen?, Precio_Venta, Stock_Minimo, ID_Categoria}` | 201 |
| PUT | `/api/products/:id` | `{Nombre, Descripcion, Imagen?, Precio_Venta, Stock_Minimo, ID_Categoria}` | 200 |
| DELETE | `/api/products/:id` | — | 200 |
| GET | `/api/categories` | — | Array de 8 categorías |
| POST | `/api/auth/login` | `{Correo, Contrasena}` | `{id, nombre, correo, rol, telefono, direccion}` |
| POST | `/api/auth/register` | `{Nombre, Correo, Contrasena, Telefono, Direccion}` | 201 `{id}` |
| GET | `/api/orders` | — | Array de pedidos |
| GET | `/api/orders/:id` | — | Pedido + detalles |
| POST | `/api/orders` | `{Fecha, Estado, Total, Tipo_Entrega, ID_Usuario, productos[]}` | 201 `{id}` |
| POST | `/api/payments/process` | `{cardNumber, expiryDate, cvv, amount}` | `{success, transactionId}` |

---

## 5. Comandos

```bash
npm run dev          # Frontend (Vite) → http://localhost:5173
npm run server       # Backend (Express) → http://localhost:3001
npm run build        # Build producción → dist/
```

### Inicio rápido (dos terminales)

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

O usar el script automatizado: `scripts_dev\iniciar-proyecto.bat`

---

## 6. Scripts del desarrollador (en `scripts_dev/`)

| Script | Propósito |
|--------|-----------|
| `empacar-proyecto.ps1 / .bat` | Genera .zip con código fuente + docs (excluye node_modules, dist, .git, scripts_dev, bitácora) |
| `iniciar-proyecto.ps1 / .bat` | Verifica/instala Node.js, npm install, verifica MySQL, inicia backend + frontend |
| `mysql-reset-*.bat` | Versiones del script para recovery de password root de MySQL |

---

## 7. Errores comunes y troubleshooting

| # | Error | Causa | Solución |
|---|-------|-------|----------|
| 1 | `Backend no responde en :3001` | Backend no iniciado | `npm run server` en terminal separada |
| 2 | `Error connecting to database` | MySQL no corriendo | `net start MySQL84` como Admin |
| 3 | `Access denied for root` | Password root perdido | Ejecutar script de recovery como Admin |
| 4 | `Port 3306 already in use` | Otro servicio en el puerto | Verificar con `netstat -ano \| findstr 3306` |
| 5 | `ECONNREFUSED :3001` | Backend caído o no arrancó | Revisar logs en la terminal del backend |
| 6 | `Duplicate entry for PK` | Reintento de seed data | Usar `TRUNCATE` antes de re-insertar |
| 7 | `Out of range value for column` | Número telefónico > INT_MAX | Usar números < 2147483647 |

---

## 8. Historial de git

```
* d58f298 Renombrado archivo de conexión a la base de datos.
* 1a8f766 Añadido la conexión con la base de datos.
* 0d2d4c9 Fix typo in payment confirmation section
* d89c72a Corrige texto en sección de confirmación de pago
* 97da1e8 feat: Tienda Parque 100 - plataforma e-commerce con arquitectura MVC
```

Commit raíz `eb1dee3` (forzado a `97da1e8` tras amend) — autor corregido a `ferdcard-ux`.

**Archivos nuevos desde Sesión 7 (pendientes de commit):**

- `server/routes/categories.js` — endpoint de categorías
- `src/utils/useScrollLock.ts` — hook scroll lock
- `src/views/components/home/AllCategoriesModal.tsx` — modal "Ver todas" categorías
- `src/views/components/home/CategoryModal.tsx` — modal productos por categoría
- `src/views/components/admin/EditProductModal.tsx` — modal editar producto
- `CHANGELOG.md` — registro de cambios del proyecto

---

## 9. Instrucciones para ejecutar en cualquier equipo Windows

> Esta sección es para los compañeros del equipo que necesitan correr el proyecto en su PC.

### 9.1. Requisitos mínimos

| Software | Versión | Dónde conseguirlo |
|----------|---------|-------------------|
| Windows | 10 u 11 | — |
| Git | 2.30+ | https://git-scm.com/downloads |
| Node.js | 18+ | https://nodejs.org/ (recomendado 22 LTS) |
| MySQL | 8.0+ o MariaDB 10.4+ | https://dev.mysql.com/downloads/ o XAMPP (https://www.apachefriends.org/) |
| Navegador | Chrome, Edge o Firefox | — |

### 9.2. Paso a paso

#### PASO 1 — Clonar el repositorio

Abre una terminal (PowerShell o CMD) y ejecuta:

```bash
git clone https://github.com/ferdcard-ux/parque100-ecommerce.git
cd parque100-ecommerce
```

> **Nota:** El repositorio es público, no necesitas autenticación para clonar.

#### PASO 2 — Crear carpeta de scripts

Los scripts de automatización **no están en el repositorio** (son solo para el equipo de desarrollo). Debes crearlos manualmente:

1. Ve a la carpeta donde clonaste el proyecto
2. Crea una carpeta `scripts_dev` al mismo nivel que `parque100-ecommerce`
3. Solicita al líder del equipo los siguientes archivos y pégalos dentro de `scripts_dev/`:
   - `iniciar-proyecto.ps1`
   - `iniciar-proyecto.bat`
   - `setup.sql`
   - `empacar-proyecto.ps1`
   - `empacar-proyecto.bat`

La estructura debe quedar así:

```
CARPETA_PRINCIPAL/
├── parque100-ecommerce/     ← el repo clonado
└── scripts_dev/             ← carpeta creada manualmente
    ├── iniciar-proyecto.ps1
    ├── iniciar-proyecto.bat
    ├── setup.sql
    ├── empacar-proyecto.ps1
    └── empacar-proyecto.bat
```

> Si no consigues los scripts, puedes descargarlos del repositorio de scripts del equipo o pedírselos directamente al líder.

#### PASO 3 — Verificar MySQL

Asegúrate de tener MySQL instalado y funcionando:

1. Abre PowerShell o CMD
2. Ejecuta: `mysql -u root -e "SELECT 1;"`
   - Si funciona → pasa al PASO 4
   - Si dice `'mysql' no se reconoce` → MySQL no está en PATH o no está instalado
   - Si dice `Access denied` → tu root tiene contraseña. Deberás editar `connection.js` más adelante

**Si no tienes MySQL instalado:**

Opción A — MySQL Server (recomendado):
1. Descarga e instala desde https://dev.mysql.com/downloads/installer/
2. Durante la instalación, cuando pida contraseña de root, déjala **en blanco** o anótala
3. Anota la contraseña que pusiste

Opción B — XAMPP:
1. Descarga e instala desde https://www.apachefriends.org/
2. Abre XAMPP Control Panel
3. Dale **Start** al módulo **MySQL**

#### PASO 4 — Ejecutar el script de inicio

Esta es la parte más fácil. Solo da **doble clic** en:

```
scripts_dev/iniciar-proyecto.bat
```

O si prefieres terminal:

```bash
cd scripts_dev
.\iniciar-proyecto.bat
```

El script hará TODO automáticamente:
1. ✅ Verifica que Node.js esté instalado (si no, lo instala)
2. ✅ Ejecuta `npm install` para instalar dependencias
3. ✅ Busca MySQL en ubicaciones comunes del sistema
4. ✅ Verifica conexión a MySQL
5. ✅ Si la BD no existe, ejecuta `setup.sql` para crearla con datos de prueba
6. ✅ Inicia el backend en `http://localhost:3001`
7. ✅ Inicia el frontend en `http://localhost:5173`

### 9.3. Si el script falla

#### Error: "MySQL no encontrado"
1. El script buscó MySQL en las rutas más comunes y no lo encontró
2. Instala MySQL (ver PASO 3) o verifica que esté en el PATH del sistema
3. Puedes probar manualmente con: `Get-Command mysql.exe` (PowerShell) o `where mysql` (CMD)

#### Error: "Access denied"
Tu MySQL tiene una contraseña para root. Debes actualizar `connection.js` en la raíz del proyecto:

```js
// Antes (password vacío)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',         // ← cambiar esto
  database: 'parque100',
  ...
});

// Después (con tu contraseña)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'tu_contraseña',  // ← la que pusiste al instalar MySQL
  database: 'parque100',
  ...
});
```

Luego ejecuta manualmente el `setup.sql`:

```bash
mysql -u root -p < scripts_dev/setup.sql
```

Te pedirá la contraseña. Una vez importado, vuelve a ejecutar `iniciar-proyecto.bat`.

#### Error: "No se pudo iniciar el backend"
1. Verifica que el puerto 3001 no esté ocupado:
   ```bash
   netstat -ano | findstr 3001
   ```
2. Si hay algo en ese puerto, cierra el programa que lo usa o cambia el puerto en `server/index.js`
3. Verifica que MySQL esté corriendo

### 9.4. Inicio manual (sin script automatizado)

Si prefieres hacerlo manualmente:

```bash
# 1. Ir a la carpeta del proyecto
cd parque100-ecommerce

# 2. Instalar dependencias
npm install

# 3. Configurar BD (solo la primera vez)
mysql -u root < scripts_dev/setup.sql

# 4. Iniciar backend (Terminal 1)
npm run server

# 5. Iniciar frontend (Terminal 2)
npm run dev
```

### 9.5. Probar que todo funciona

| Componente | URL | Qué debe aparecer |
|-----------|-----|-------------------|
| Frontend | http://localhost:5173 | Página de inicio con productos |
| Backend | http://localhost:3001/api/products | JSON con 10 productos |
| Login admin | http://localhost:5173/login | Usar `admin@parque100.com` / `admin123` |
| Login usuario | http://localhost:5173/login | Usar `usuario@ejemplo.com` / `12345678` |

### 9.6. Resumen de rutas y archivos importantes

```
CARPETA_PRINCIPAL/
├── parque100-ecommerce/
│   ├── connection.js          ← Credenciales MySQL (editar aquí si hay password)
│   ├── server/index.js        ← Backend Express
│   └── src/services/          ← Servicios que llaman a la API
│
└── scripts_dev/
    ├── iniciar-proyecto.bat   ← Doble clic y ya (script principal)
    ├── iniciar-proyecto.ps1   ← Versión PowerShell del mismo script
    ├── setup.sql              ← Crea BD + tablas + datos de prueba
    ├── empacar-proyecto.bat   ← Genera .zip para entregar al instructor
    └── empacar-proyecto.ps1   ← Versión PowerShell del empaquetador
```

### 9.7. Notas importantes

- **Node.js** se instala automáticamente si no está presente (vía `winget` o descarga directa)
- **MySQL NO se instala automáticamente** — debes instalarlo manualmente (PASO 3)
- El script **busca MySQL** en XAMPP, WAMP y MySQL Server automáticamente
- Si tu MySQL tiene contraseña, edita `connection.js` (sección 9.3)
- El proyecto usa el **puerto 3001** para el backend y **5173** para el frontend

---

---

### Sesión 7 — 01/07/2026
**Objetivo:** Completar CRUD frontend, agregar modales funcionales de categorías, scroll lock, imagen URL, dropdown de usuario y documentación.

#### Cambios realizados

| # | Cambio | Archivos | Detalle |
|---|--------|----------|---------|
| 1 | CRUD frontend completo | `AddProductModal.tsx`, **`EditProductModal.tsx` (nuevo)**, `ProductTable.tsx`, `use-product-controller.ts`, `App.tsx`, `AdminInventoryPage.tsx` | Modal de agregar producto ahora funcional con estado y submit. Nuevo modal de editar producto con datos precargados. Botón de editar en tabla ahora tiene handler. |
| 2 | Imágenes únicas por producto | `product.service.ts` | `mapProduct` asignaba la misma URL de Unsplash a todos los productos. Se restauró el mapa `PRODUCT_IMAGES` con imagen única por nombre de producto + `CATEGORY_IMAGES` como fallback por categoría. |
| 3 | Categorías desde endpoint | `server/routes/categories.js` (nuevo), `server/index.js`, `product.service.ts` | `getCategories()` antes derivaba categorías de los productos (solo 4). Ahora consulta `GET /api/categories` que trae las 8 desde la tabla `categorias`. |
| 4 | Scroll lock en modales | `utils/useScrollLock.ts` (nuevo), `CategoryModal.tsx`, `AllCategoriesModal.tsx`, `AddProductModal.tsx`, `EditProductModal.tsx`, `LoginForm.tsx` | Hook que aplica `overflow: hidden` al body cuando un modal está abierto y lo restaura al cerrarse. Aplicado a los 5 modales del sistema. |
| 5 | Login X button | `LoginForm.tsx` | Botón X en esquina superior derecha del card de login, navega a `/`. |
| 6 | Categorías navegables + "Ver todas" modal | `Navbar.tsx`, `CategoryGrid.tsx`, `HomePage.tsx`, **`AllCategoriesModal.tsx` (nuevo)** | Link "Categorías" en navbar ahora hace scroll suave a la sección. Botón "Ver todas" abre modal con las 8 categorías como botones funcionales. Cada categoría abre `CategoryModal` con productos filtrados (o mensaje si está vacía). |
| 7 | User dropdown | `Navbar.tsx`, `RootLayout.tsx`, `App.tsx` | Cuando el usuario está logueado, el botón rojo muestra iniciales + nombre. Al hacer clic, menú desplegable con info de cuenta, "Cambiar de usuario" y "Cerrar sesión". Se pasa `user` y `logout` desde el contexto. |
| 8 | Admin Home button | `AdminInventoryPage.tsx` | Botón "Inicio" con icono Home en el header del panel admin, enlaza a `/`. |
| 9 | Campo imagen URL en formularios | `AddProductModal.tsx`, `EditProductModal.tsx`, `product.service.ts`, `server/routes/products.js` | Se agregó columna `Imagen VARCHAR(500)` a la tabla `productos`. Backend POST/PUT aceptan campo `Imagen`. Frontend muestra campo opcional "URL de imagen" en ambos modales. `mapProduct` usa `row.Imagen` primero. |
| 10 | Actualización de documentación | `Docs/*.md`, **`CHANGELOG.md` (nuevo)** | Todos los documentos alineados con el estado actual. CHANGELOG con historial completo del proyecto. |

#### Pruebas de API (CRUD productos)

```
[1/4] CREATE  → "Producto creado" (P099, $9999, stock 25)
[2/4] READ    → "Producto de Prueba CRUD" ✅
[3/4] UPDATE  → "Producto Actualizado CRUD" ($7777, stock 15) ✅
[4/4] DELETE  → "Producto eliminado" (P099 no existe en BD) ✅
```

#### Prueba imagen URL personalizada

```
POST /api/products con Imagen="https://ejemplo.com/mi-imagen.jpg"
→ Producto creado
→ Imagen devuelta: "https://ejemplo.com/mi-imagen.jpg" ✅
→ Verificado en BD: columna Imagen con valor correcto ✅
```

#### Métrica de build

```
1655 modules transformed, 0 errores
dist/ | index.html (0.79 kB) | CSS (108 kB) | JS (353 kB)
```

---

*Última actualización: 01/07/2026*
