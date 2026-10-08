# Changelog — Tienda Parque 100

> Todos los cambios notables del proyecto se documentan aquí.

## [1.5.1] — 2026-10-08

### Correcciones y mejoras
- Favoritos: los IDs se persisten como texto (antes se perdían al recargar) y se sincronizan entre vistas.
- Inventario: agregar/editar acepta URL web o archivo local de imagen (vista previa, máx. 2 MB); columna `productos.Imagen` a `MEDIUMTEXT` y límite JSON del backend a 10 MB.
- Mis compras: tarjeta clicable al detalle (sin botón "Ver detalle") y botón Cancelar rojo redondeado.
- Cancelaciones admin: motivos operativos propios (distintos a los del cliente); cancelado terminal (sin reanudar) en UI y backend (409).
- Dirección: el teléfono exige exactamente 10 dígitos.
- Pedidos: el backend propaga el mensaje real de error (antes todo se mostraba como "sin conexión"); reportes excluyen cancelados de ventas/ticket y fechan en horario local.
- Perfil: "Guardar" persiste nombre, correo y teléfono (`PUT /api/users/:id/profile`) y refleja la cuenta activa.
- Cuentas: correo y teléfono únicos en registro, alta/edición admin y perfil (409 específico); el registro pide teléfono de 10 dígitos.

## [1.5.0] — 2026-10-07

### Compras
- Envío siempre sin costo (`SHIPPING_COST = 0`).
- Cancelación con motivo obligatorio (lista + texto libre) y aviso de reembolso: cliente en pendiente/preparando (inhabilitado en envío/entregado); admin desde el select con motivo; `PUT /api/orders/:id/cancel` con `Motivo_Cancelacion`, stock devuelto y `DELETE` anterior retirado.
- Pedidos cancelados visibles con motivo y aviso de devolución (usuario y admin con tarjeta Cancelados).

## [1.4.0] — 2026-10-06

### Navegación de compra y productos
- Flujo Carrito → Dirección → Método → Confirmación con indicador de progreso (pasos completados enlazan atrás) y resumen superior fijo (productos + total) en las 4 pantallas; flecha de regreso a cada paso conservando lo digitado.
- Breadcrumb Catálogo > Categoría > Producto en el detalle (categoría real, enlaces al catálogo y al listado).
- Pago en efectivo contra entrega: monto obligatorio, cálculo y presentación del cambio; aviso prioritario al admin (banner + campana) para llevar la devolución.
- Nequi con comprobante en imagen (carga local, botón habilitado solo con archivo); el comprobante llega al admin en el detalle.
- Advertencia de posible demora en confirmación y en detalle de pedido activo.

## [1.3.3] — 2026-10-06

### Correcciones y mejoras
- Bugs: enlace "Mapa del Sitio" del menú móvil a `/mapa-sitio`; confirmación de pago muestra el pedido real (`backendId`) con enlace "Ver mi pedido"; "Términos y Condiciones" y "Política de Privacidad" del registro enlazan a `/terminos` (nueva página) y `/privacidad`.
- Funcionales: carrito persistente por cuenta en localStorage; tope de stock al añadir y en cantidades (con aviso "Máx. disponibles"); cancelación de pedidos pendientes por el usuario (`DELETE /api/orders/:id`, solo pendiente, con confirmación en dos pasos).
- Visuales: skeletons de carga en catálogo, pedidos y detalle; paginación del catálogo (12 por página); rating ficticio eliminado del detalle; banners verificados (HTTP 200).
- Script `scripts_dev-ecommerce2`: consola interactiva con detener/pausar/reanudar; chequeos HTTP para el frontend (Vite en IPv6); apertura explícita en el navegador por defecto y solo si el frontend responde.

## [1.3.2] — 2026-10-06

### Mejoras y correcciones
- Notificaciones de usuario: campana en el navbar (solo con sesion) con el estado de cada pedido y enlace al detalle; el badge cuenta pedidos no entregados.
- Imagenes de productos: 15 fotos Pexels verificadas una por una (sin repetidos ni errores) para Carnes, Granos, Panaderia, Bebidas y Limpieza; corregida la extension del archivo de la foto de pollo.
- Clientes admin: CRUD completo (agregar, editar datos y rol, eliminar con proteccion 409 si tiene pedidos) con `POST /users`, `PUT /users/:id/admin` y `DELETE /users/:id`.
- Flujo de compra con login: `addToCart` redirige a `/login?next=...` sin sesion; rutas de compra, cuenta y favoritos protegidas con retorno post-login; panel admin solo para administradores.
- Multisesion: "Cambiar de usuario" agrega otra cuenta sin cerrar la actual; menu con lista de sesiones activas para alternar; "Cerrar sesion" cierra solo la activa.

## [1.3.1] — 2026-10-05

### Correcciones de funcionalidad
- Login: validaciones de correo y contraseña con mensajes visibles; "¿Olvidaste tu contraseña?" abre modal de recuperación (`POST /api/auth/recover` con clave temporal); "Recuérdame" persiste la sesión (localStorage vs sessionStorage).
- Perfil: "Cambiar contraseña" funcional mediante modal y `PUT /api/auth/password`.
- Direcciones: agregadas columnas `Torre_Bloque`, `Piso`, `Apartamento` a `usuario` (arreglo del error Unknown column) y alineadas en `setup.sql`; el checkout ahora persiste snapshot de entrega y pago en `pedidos`.
- Cadena de pago: flujo Nequi real (`GET/POST /payment-card?method=nequi` con formulario de teléfono y `processNequiPayment`).
- Admin: campana de notificaciones con pedidos pendientes reales; nuevas páginas `/admin/clientes` (con `GET /api/users`) y `/admin/configuracion`; inventario migrado al shell común.
- Tienda: destacados y recomendados enlazan a `/producto/:id`; tarjeta de categoría y modal cierran al navegar; buscador navbar navega a `/catalogo?q=`; favoritos con badge en navbar y página `/favoritos`; Hero/Promo CTAs a `/catalogo`.
- Footer: categorías enlazan a `/catalogo?cat=`, ayuda a `/ayuda` (FAQ acordeón), social a sitios externos reales, Privacidad/Cookies a `/privacidad` y Mapa del sitio a `/mapa-sitio`.

## [1.3.0] — 2026-10-05

### Pantallas adicionales (prototipo "Pantallas nuevas restantes" integrado)
- Nuevas páginas de cuenta: `/cuenta` (AccountPage), `/perfil` (ProfilePage), `/compras` (OrdersPage) y `/compras/:id` (OrderDetailPage) con tracker de estado.
- Nuevas páginas de tienda: `/catalogo` (CatalogPage con chips, búsqueda y orden) y `/producto/:id` (ProductDetailPage con relacionados).
- Nuevas páginas admin: `/admin/pedidos-pendientes`, `/admin/pedidos`, `/admin/pedidos/:id` y `/admin/reportes` (KPIs, pedidos por estado y filtros de periodo).
- Nuevos componentes compartidos: `shared/page-header`, `shared/section-title`, `shared/status-badge`, `shared/order-tracker`, `shared/empty-state`, `shop/product-card`, `admin/AdminPageShell`.
- Nuevos controladores: `use-orders-controller`, `use-admin-orders-controller`, `use-favorites-controller` (localStorage), `use-catalog-controller`.
- Backend: nuevo endpoint `PUT /api/orders/:id/status` para tomar pedidos y cambiar su estado.
- Navbar: enlaces Catálogo, Mi cuenta y Mis compras (desktop y móvil).

## [1.2.1] — 2026-08-22

### Calidad y verificación
- Verificación estática del script de inicio para Windows ejecutada desde entorno Linux (PowerShell 7.6.5 portátil + PSScriptAnalyzer 1.25.0): sintaxis OK, compatibilidad con PowerShell 5.1 OK
- Corregida codificación del script Windows (BOM UTF-8) para render correcto de acentos en `powershell.exe`

## [1.2.0] — 2026-08-22

### Arquitectura backend (MVC)
- Backend reestructurado en capas: `server/config/db.js` (pool MySQL), `server/models/*.model.js` (SQL encapsulado), `server/controllers/*.controller.js` (lógica), `server/routes/` (routers delgados)
- Creación de pedidos ahora **transaccional** (`beginTransaction/commit/rollback`) garantizando atomicidad entre `pedidos` y `detalle_pedido`
- `connection.js` movido de la raíz a `server/config/db.js`

### Estándares de codificación
- `tsconfig.json` creado (strict mode) — el proyecto usaba TypeScript sin configuración de chequeo de tipos
- `.editorconfig`, `.prettierrc` y `Docs/CODING_STANDARDS.md` con las convenciones obligatorias
- `src/vite-env.d.ts` agregado; `@types/react-dom` instalado

### Documentación
- JSDoc integral (`@fileoverview`, `@param`, `@returns`) en todo el backend y núcleo del frontend (models, services, controllers, utils)
- 6 errores de tipos latentes corregidos al habilitar el chequeo estricto

### Verificación
- Endpoints probados end-to-end: productos, categorías, login, pedidos (201) y pagos
- `tsc --noEmit` sin errores; build de producción exitoso

## [1.1.1] — 2026-08-22

### Hotfix (herramientas del equipo)
- Restauradas credenciales `-u root` en el helper `run_mysql` del script de inicio Linux

## [1.1.0] — 2026-08-22

### Herramientas del equipo (fuera del repo: `scripts_dev/`)
- Script de inicio automatizado para Linux (`iniciar-proyecto.sh`): instalación automática de Node.js y MySQL/MariaDB, manejo de `auth_socket`, limpieza de procesos con `trap`
- `setup.sql` corregido: `SET FOREIGN_KEY_CHECKS` alrededor de los TRUNCATEs (fallaba con ERROR 1701 por llaves foráneas)

## [1.0.1] — 2026-07-09

### Commits organizados en el repositorio
- Desarrollo completo de la Sesión 7 publicado en 5 commits en `origin/main`
- Historial de git reorganizado: backend, CRUD, categorías/modales, servicios/config, documentación
- Este archivo (`CHANGELOG.md`) creado para registrar cambios del proyecto
- Bitácora del desarrollador excluida del repositorio (documento interno)

## [1.0.0] — 2026-07-01

### Proyecto base
- Inicialización del proyecto con React 18 + TypeScript + Vite 6 + Tailwind CSS 4
- Arquitectura MVC adaptada a frontend: `models/`, `services/`, `controllers/`, `views/`
- 9 páginas funcionales: Home, Cart, Login, Register, Address, PaymentMethod, CardPayment, PaymentSuccess, AdminInventory
- ~40 componentes shadcn/ui + ~30 componentes atómicos del negocio
- Sistema de carrito de compras con contexto global
- Flujo completo de checkout: dirección → método de pago → tarjeta → confirmación
- Panel administrativo con estadísticas y tabla de productos

### Estilos
- Configuración de Tailwind CSS v4 con variables CSS en `theme.css`
- Unificación de estilos: eliminado `globals.css` heredado de shadcn
- Limpieza de archivos: `pnpm-workspace.yaml`, `postcss.config.mjs`, `guidelines/`, `dist/`

### Git y repositorio
- Configuración de identidad Git: `ferdcard-ux <******@gmail.com>`
- Repositorio público `parque100-ecommerce` creado en GitHub
- Rama `master` renombrada a `main`, sincronización con remoto
- Integración de 4 commits de compañeros (conexión BD, correcciones texto)
- Archivos `.gitignore` configurado, `dist/` excluido

### Base de datos
- MySQL 8.4.9: reseteo de password root vía `init-file`
- BD `parque100` con 5 tablas: `categorias`, `productos`, `usuario`, `pedidos`, `detalle_pedido`
- Datos de prueba: 8 categorías, 10 productos, 2 usuarios
- Columna `Imagen VARCHAR(500)` agregada a tabla `productos`

### Backend Express
- Servidor en `server/index.js` (puerto 3001, CORS habilitado)
- `connection.js` reescrito con `mysql2/promise` y pool de conexiones
- CRUD completo de productos: GET, POST, PUT, DELETE
- Endpoint de categorías: `GET /api/categories`
- Autenticación: login y registro de usuarios
- Pedidos: listar, obtener por ID, crear con detalle
- Pagos: procesamiento simulado con 90% de éxito

### Servicios migrados a API
- `product.service.ts`: de mock a fetch API, mapeo de columnas DB a camelCase
- `auth.service.ts`: de credenciales hardcodeadas a fetch API
- `payment.service.ts`: de setTimeout mock a fetch API
- `order.service.ts`: persistencia vía API con fallback a memoria
- Imágenes únicas por producto via `PRODUCT_IMAGES` + `CATEGORY_IMAGES`

### Modales y funcionalidad
- Modal "Agregar Producto" funcional con estado y submit a API
- Modal "Editar Producto" con datos precargados
- Modal "Ver todas categorías" con botones funcionales
- Modal de productos por categoría (filtro dinámico + mensaje si vacía)
- Botón X para cerrar login y volver al inicio
- Scroll lock en todos los modales (`useScrollLock` hook)
- Dropdown de usuario con info de cuenta y cerrar sesión
- Navegación "Categorías" con scroll suave a la sección
- Botón "Inicio" en panel administrativo

### CRUD verificado
- CREATE: inserción de nuevo producto vía API con/sin imagen URL
- READ: listar y obtener por ID
- UPDATE: modificar precio, stock, nombre, imagen
- DELETE: eliminación con verificación en BD
- Persistencia confirmada en MySQL para todas las operaciones

### Scripts de automatización (Externos al desarrollo)
- `scripts_dev/iniciar-proyecto.ps1/.bat`: verifica Node.js, npm install, MySQL, inicia backend + frontend
- `scripts_dev/empacar-proyecto.ps1/.bat`: genera .zip de entrega excluyendo scripts_dev y bitácora
- Scripts de recovery de password MySQL (init-file)
- `scripts_dev/setup.sql`: CREATE DATABASE + tablas + datos de prueba

### Documentación
- `Docs/arquitectura.md`: patrón MVC, estructura de directorios, flujo de datos
- `Docs/manual-tecnico.md`: requisitos, instalación, convenciones, backend, BD, despliegue
- `Docs/guia-uso.md`: credenciales, funcionalidades por pantalla, rutas
- `Docs/bitacora-desarrollador.md`: 9+ sesiones documentadas con problemas y soluciones `(Exclusivo para el DEV)`
- `Docs/index.md`: índice de documentos
- `README.md`: descripción del proyecto
- `CHANGELOG.md`: este archivo

## [0.1.0] — 2026-06-26

### Primer commit
- Maqueta inicial con estructura MVC
- Componentes base de shadcn/ui
- Mock data para productos, categorías, usuarios
- Diseño responsive con Tailwind CSS
