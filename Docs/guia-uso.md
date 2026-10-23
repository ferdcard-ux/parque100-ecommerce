# Guía de Uso

## Acceso académico

Este proyecto es una demostración académica para personas autorizadas. Entra
por `/access.html`, autentícate con la cuenta del equipo y acepta el descargo
obligatorio. Para probar las funciones de la tienda, inicia sesión después con
una cuenta demo independiente. No hay registro abierto al público: tras el
acceso académico y el descargo puedes crear una cuenta demo en `/register`, o
solicitarla al responsable desde el panel local. No introduzcas datos
financieros ni datos personales reales.

## Credenciales de prueba

| Rol | Correo |
|-----|--------|
| Usuario estándar | `usuario@ejemplo.com` |
| Administrador | `admin@parque100.com` |
| Domiciliario | `domiciliario@parque100.com` |

> Las contraseñas no se publican en el repositorio: el responsable del equipo
> las entrega por un canal interno. Las del servidor público son distintas a
> las de una instalación local nueva.

## Funcionalidades por pantalla

### Inicio (`/`)
- **Hero Banner**: ocupa el ancho disponible e incluye un carrusel de seis productos reales con categoría, precio, descuento, flechas, puntos y botón "Añadir". Si no hay sesión, "Añadir" redirige al login. Los botones "Comprar ahora" y "Ver ofertas" navegan al catálogo
- **Más vendido de la semana**: panel sobre el carrusel con el producto que más unidades vendió en los últimos 7 días, su precio, descuento y enlace a la ficha. No aparece si no hubo ventas válidas
- **Categorías**: 8 categorías con ilustración SVG propia. Cada categoría es clickeable y abre un modal con los productos filtrados (imagen y nombre enlazan al detalle). Si la categoría no tiene productos, muestra mensaje "Categoría sin productos". Botón "Ver todas" abre un modal con las 8 categorías como botones funcionales
- **Ofertas de la semana**: carril con productos en promoción
- **Productos Destacados**: cuadrícula con productos, cada uno con imagen única, precio, favorito y botón "Añadir" al carrito (imagen y nombre enlazan al detalle)
- **Frescos del día**: carril con frutas y verduras destacadas
- **Footer**: categorías enlazan al catálogo filtrado, ayuda al centro de ayuda, redes a sitios externos, Privacidad/Cookies y Mapa del sitio a sus páginas

### Login (`/login`)
- Inicio de sesión con correo y contraseña
- Validaciones visibles: correo inválido, contraseña vacía y credenciales incorrectas
- Botón **X** en la esquina superior derecha para cerrar y volver al inicio
- Opción "Recuérdame": persiste la sesión entre cierres (localStorage) o solo la pestaña (sessionStorage)
- "¿Olvidaste tu contraseña?": muestra el canal de soporte; la recuperación automática está deshabilitada hasta configurar entrega verificada
- Retorno post-login con `?next=`: tras ingresar vuelve a la página solicitada
- Modo multisesión con `?mode=switch`: agrega otra cuenta sin cerrar la actual
- Alta de cuenta demo en `/register` después del acceso académico y el descargo
- Modal de inicio de sesión para administradores (link "¿Eres administrador?")

### Navegación — Menú de usuario y notificaciones
- Al iniciar sesión, el botón "Iniciar Sesión" se reemplaza por un avatar con las iniciales del usuario
- **Campana de notificaciones**: badge con pedidos no entregados y desplegable con el estado de cada pedido y enlace a su detalle
- Al hacer clic en el avatar se despliega un menú con:
  - Nombre completo y correo electrónico
  - Badge "Administrador" si aplica
  - Accesos a "Mi cuenta" y "Mis compras"
  - Opción "Cambiar de usuario": abre el login en modo multisesión (la sesión actual se mantiene)
  - Lista de "Otras sesiones activas" para alternar de cuenta sin ingresar de nuevo
  - Opción "Cerrar sesión" (cierra solo la cuenta activa; las demás siguen disponibles)
- El menú se cierra al hacer clic fuera de él

### Acceso académico (`/access.html`)
- Autenticación independiente para integrantes autorizados del equipo
- Aceptación obligatoria del descargo antes de navegar; la aceptación se asocia a cada sesión/dispositivo
- Una misma cuenta puede tener varias sesiones activas, una por dispositivo
- El panel local lista cada sesión con dispositivo, IP y actividad, y permite revocar una o todas; cambiar la contraseña o desactivar la cuenta revoca todas
- Las cuentas se administran desde la pestaña **ACCESO ACADÉMICO** del panel local
- `/register` crea cuentas demo de la tienda, no cuentas de acceso académico

### Catálogo (`/catalogo`)
- Chips por categoría sincronizados con `?cat=`, buscador del navbar con `?q=`, orden (relevancia, precio, nombre)
- Skeletons de carga, estado vacío con botón "Ver todos los productos" y paginación (12 por página)
- Favorito por producto y botón "Añadir" (exige sesión, con tope de stock)

### Detalle de producto (`/producto/:id`)
- Breadcrumb Catálogo > Categoría (real, enlaza al listado) > Producto actual
- Galería, categoría, precio, stock disponible, selector de cantidad y relacionados clicables
- Skeleton de carga; sin rating ficticio
- Añadir al carrito exige sesión

### Mi cuenta (`/cuenta`), Perfil (`/perfil`) y Compras (`/compras`, `/compras/:id`)
- Panel con accesos a perfil, direcciones y compras; cierre de sesión
- Perfil editable (modo Editar/Guardar con persistencia real en la BD y mensajes de error) y cambio de contraseña funcional
- Historial de pedidos: cada tarjeta abre su detalle al clic (también con teclado); botón rojo "Cancelar pedido" en pendiente/preparando (inhabilitado en envío/entregado) con motivo obligatorio y aviso de reembolso; detalle con productos, totales y entrega
- Reseñas: "Dejar una reseña" en pedidos entregados (1–5 estrellas por producto, solo lo comprado) y calificación del envío en el detalle
- Envío siempre sin costo

### Favoritos (`/favoritos`), Ayuda (`/ayuda`), Privacidad (`/privacidad`), Mapa (`/mapa-sitio`)
- Favoritos persistidos en localStorage con badge en el navbar
- Centro de ayuda con preguntas frecuentes; política de datos y cookies; índice de rutas

### Carrito (`/cart`)
- Lista de productos agregados con imagen, nombre, precio unitario
- Persistente por cuenta en localStorage (sobrevive recargas; invitado separado)
- Control de cantidad (+ / -) con tope de stock y aviso "Máx. disponibles"; eliminar producto
- Resumen del pedido con subtotal, envío y total
- Productos recomendados clicables basados en el carrito actual
- Botón "Continuar" para iniciar el flujo de compra
- Requiere sesión: sin login redirige a `/login?next=/cart`

### Dirección de entrega (`/address`)
- Formulario con datos del destinatario (nombre, apellido, teléfono de 10 dígitos obligatorio)
- Ubicación en el conjunto (torre, piso, apartamento)
- Notas adicionales para el domiciliario
- Resumen del pedido y tiempo estimado de entrega

### Método de pago (`/payment-method`)
- Efectivo contra entrega está disponible.
- Tarjeta y Nequi solo aparecen habilitados cuando el servidor configura `PAYMENTS_MODE=demo`; ambos usan un flujo de pasos interno, sin pasarela, cobro ni datos financieros.
- Al confirmar, el sistema guarda la transacción DEMO y el pedido, y descuenta inventario en una sola operación de BD. El personal puede avanzar sus estados demostrativos; la operación no representa una compra o entrega real. Los registros históricos sin transacción DEMO aprobada siguen bloqueados para despacho.
- Resumen del pedido con el total

### Confirmación del pedido (`/payment-card`)
- Tarjeta y Nequi no solicitan datos de tarjeta, CVV, claves, transferencias ni comprobantes. Inicia el flujo, revisa la referencia ficticia y confirma la simulación para registrar el pedido y el movimiento de inventario.
- Variante efectivo (`/payment-card?method=cash`): monto recibido obligatorio con cálculo del cambio en vivo

### Confirmación (`/payment-success`)
- Animación de éxito con icono de check
- Número de pedido real (asignado por el backend) con botón "Ver mi pedido"
- Efectivo: muestra recibido y cambio
- Demo: confirma que no hubo cobro real y muestra la referencia ficticia. El pedido y el inventario sí quedan actualizados en la base académica
- Advertencia de posible demora en el despacho
- Timeline del estado del pedido
- Botón para volver a la tienda

### Panel Administrativo (`/admin`)
- Sidebar colapsable con navegación (Inventario, Pedidos pendientes, Administrar pedidos, Reportes, Clientes, Configuración)
- Solo accesible para administradores autenticados (otros roles rebotan al inicio)
- Campana con pedidos pendientes reales y enlace al detalle
- Botón **Ver tienda** para volver a la página principal
- Estadísticas: total productos, en stock, bajo stock, sin stock
- Tabla de productos con búsqueda, filtro por estado y paginación
- **CRUD completo**: agregar (modal con nombre, categoría preestablecida, cantidad, precio, contenido/unidad e imagen por URL web o archivo local con vista previa), editar (modal precargado), eliminar (confirmación con nombre del producto, cancelable antes de ejecutar)
- Botones **Administrar categorías de productos** y **Administrar unidades de medida** con opciones para agregar, renombrar y eliminar. La lista desplegable de categorías evita nombres duplicados y ofrece **+ Agregar categoría**; no se eliminan opciones que sigan en uso.
- Importación desde la plantilla CSV oficial y exportación en CSV o PDF

### Pedidos admin (`/admin/pedidos-pendientes`, `/admin/pedidos`, `/admin/pedidos/:id`)
- Pendientes con botón "Tomar pedido" (pendiente → preparando)
- Los pedidos DEMO se identifican claramente; solo los que tienen transacción simulada aprobada pueden avanzar por estados en el flujo administrativo
- Cancelación con motivos operativos propios del admin (distintos a los del cliente); el pedido cancelado no se puede reanudar (select deshabilitado y 409 en backend); tarjeta Cancelados y aviso de devolución
- Efectivo prioritario: banner "llevar cambio", insignia en gestión y aviso en la campana
- Los comprobantes de pagos Nequi solo se muestran en pedidos históricos; los nuevos pedidos electrónicos están bloqueados.
- Resumen por estado, tracker compacto, cambio de estado persistente y detalle con líneas

### Reportes (`/admin/reportes`)
- KPIs (ventas no DEMO, pedidos, ticket promedio, entregados y transacciones DEMO), filtros hoy/semana/mes/personalizado y pedidos por estado
- Las cifras de ventas/ticket no suman pedidos cancelados ni transacciones DEMO

### Clientes (`/admin/clientes`) y Configuración (`/admin/configuracion`)
- CRUD de usuarios: agregar, editar datos y rol (cliente, domiciliario, admin), eliminar con diálogo de confirmación y protección si tiene pedidos; correo y teléfono únicos (409 si existen); búsqueda y filtro por rol
- Preferencias del panel persistidas en localStorage

## Flujo completo de compra (requiere sesión)

```
Carrito → Dirección de entrega → Método de pago → Confirmación
```

- Indicador de progreso en la parte superior: paso actual destacado, completados con check y clicables para volver.
- Resumen superior fijo en las 4 pantallas: cantidad de productos y valor total.
- Flecha de regreso junto al título: Dirección → Carrito, Método → Dirección, Pago → Método; se conserva lo digitado.

```
Inicio → Agregar productos al carrito (sin sesión: redirige al login)
  → Carrito → Revisar y continuar
  → Dirección de entrega → Guardar
  → Método de pago → Elegir efectivo contra entrega
  → Confirmación del pedido (el pago se realiza al recibirlo)
```

## Rutas del proyecto

Todas las rutas de la tienda requieren primero una sesión de acceso académico
autorizada y la aceptación del descargo. Las rutas que indican sesión o rol
requieren además iniciar sesión con una cuenta demo de tienda.

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | Home | Página principal |
| `/login` | Login | Inicio de sesión |
| `/access.html` | Acceso académico | Inicio de sesión del equipo autorizado |
| `/register` | Registro | Alta de cuenta demo de tienda (requiere acceso y descargo) |
| `/cart` | Cart | Carrito de compras |
| `/address` | Address | Dirección de entrega |
| `/payment-method` | Payment Method | Selección de pago |
| `/payment-card` | Card Payment | Pago con tarjeta |
| `/payment-success` | Success | Confirmación |
| `/admin` | Admin | Panel administrativo |
| `/admin/inventario` | Admin | Gestión de inventario |
| `/catalogo` | Catálogo | Listado con filtros por categoría |
| `/producto/:id` | Producto | Detalle de un producto |
| `/cuenta` | Cuenta | Panel de control del usuario |
| `/direccion` | Dirección | Dirección de entrega guardada |
| `/perfil` | Perfil | Datos personales editables |
| `/compras` | Compras | Historial de pedidos |
| `/compras/:id` | Detalle compra | Estado y detalle de un pedido |
| `/admin/pedidos-pendientes` | Admin | Pedidos por tomar |
| `/admin/pedidos` | Admin | Gestión de pedidos |
| `/admin/pedidos/:id` | Admin | Detalle de pedido |
| `/admin/reportes` | Admin | Reportes de ventas |
| `/favoritos` | Shop | Productos favoritos |
| `/ayuda` | Help | Centro de ayuda / FAQ |
| `/privacidad` | Privacy | Privacidad y cookies |
| `/terminos` | Terms | Términos y condiciones |
| `/mapa-sitio` | Sitemap | Índice de rutas |
| `/admin/clientes` | Admin | CRUD de usuarios y roles |
| `/admin/configuracion` | Admin | Preferencias del panel |
