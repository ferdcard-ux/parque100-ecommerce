# Changelog — Tienda Parque 100

> Todos los cambios notables del proyecto se documentan aquí.

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
