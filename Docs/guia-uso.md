# Guía de Uso

## Credenciales de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Usuario estándar | `usuario@ejemplo.com` | `12345678` |
| Administrador | `admin@parque100.com` | `admin123` |

## Funcionalidades por pantalla

### Inicio (`/`)
- **Hero Banner**: llamativo con ofertas del día; "Comprar ahora" y "Ver ofertas" navegan al catálogo
- **Categorías**: 8 categorías con emoji único. Cada categoría es clickeable y abre un modal con los productos filtrados (imagen y nombre enlazan al detalle). Si la categoría no tiene productos, muestra mensaje "Categoría sin productos". Botón "Ver todas" abre un modal con las 8 categorías como botones funcionales
- **Productos Destacados**: cuadrícula con productos, cada uno con imagen única, precio, favorito y botón "Añadir" al carrito (imagen y nombre enlazan al detalle)
- **Oferta Especial**: banner promocional con descuento, CTA al catálogo
- **Footer**: categorías enlazan al catálogo filtrado, ayuda al centro de ayuda, redes a sitios externos, Privacidad/Cookies y Mapa del sitio a sus páginas

### Login (`/login`)
- Inicio de sesión con correo y contraseña
- Validaciones visibles: correo inválido, contraseña vacía y credenciales incorrectas
- Botón **X** en la esquina superior derecha para cerrar y volver al inicio
- Opción "Recuérdame": persiste la sesión entre cierres (localStorage) o solo la pestaña (sessionStorage)
- "¿Olvidaste tu contraseña?": genera una clave temporal aplicable al instante
- Retorno post-login con `?next=`: tras ingresar vuelve a la página solicitada
- Modo multisesión con `?mode=switch`: agrega otra cuenta sin cerrar la actual
- Enlace a registro de cuenta
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

### Registro (`/register`)
- Formulario con nombre, apellido, correo, contraseña y confirmación
- Validación de campos (correo válido, contraseña 8+ caracteres, coincidencia)
- Aceptación de términos y condiciones (requerido para enviar, enlaza a `/terminos` y `/privacidad`)

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
- Perfil editable (modo Editar/Guardar) y cambio de contraseña funcional
- Historial de pedidos del usuario con tracker de estado y skeletons de carga; cancelación con motivo obligatorio en pendiente/preparando (inhabilitada en envío/entregado) y aviso de reembolso; detalle con productos, totales y entrega
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
- Formulario con datos del destinatario (nombre, apellido, teléfono)
- Ubicación en el conjunto (torre, piso, apartamento)
- Notas adicionales para el domiciliario
- Resumen del pedido y tiempo estimado de entrega

### Método de pago (`/payment-method`)
- Selección entre Tarjeta de crédito/débito (Visa, Mastercard, Amex), Nequi o Efectivo contra entrega
- Indicador de pago seguro SSL
- Resumen del pedido con total a pagar

### Pago con tarjeta (`/payment-card`)
- Preview visual de la tarjeta bancaria (actualiza en tiempo real)
- Campos: número de tarjeta, titular, fecha de vencimiento, CVV
- Detección automática del tipo de tarjeta (Visa/Mastercard)
- Indicador de procesamiento con spinner
- Confirmación de pago seguro
- Variante Nequi (`/payment-card?method=nequi`): adjuntar comprobante en imagen (obligatorio, máx. 3 MB); el botón se habilita al adjuntarlo y el archivo llega al admin
- Variante efectivo (`/payment-card?method=cash`): monto recibido obligatorio con cálculo del cambio en vivo

### Confirmación (`/payment-success`)
- Animación de éxito con icono de check
- Número de pedido real (asignado por el backend) con botón "Ver mi pedido"
- Efectivo: muestra recibido y cambio
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
- **CRUD completo**: agregar (modal con nombre, categoría, cantidad, precio, URL de imagen opcional), editar (modal precargado), eliminar (confirmación directa)
- Botones de importar/exportar inventario

### Pedidos admin (`/admin/pedidos-pendientes`, `/admin/pedidos`, `/admin/pedidos/:id`)
- Pendientes con botón "Tomar pedido" (pendiente → preparando)
- Cancelación con motivo desde el select (opción "cancelado (con motivo)"); tarjeta Cancelados y aviso de devolución
- Efectivo prioritario: banner "llevar cambio", insignia en gestión y aviso en la campana
- Comprobante Nequi visible en el detalle
- Resumen por estado, tracker compacto, cambio de estado persistente y detalle con líneas

### Reportes (`/admin/reportes`)
- KPIs (ventas, pedidos, ticket promedio, entregados), filtros hoy/semana/mes/personalizado y pedidos por estado

### Clientes (`/admin/clientes`) y Configuración (`/admin/configuracion`)
- CRUD de usuarios: agregar, editar datos y rol (cliente, empleado, admin), eliminar con protección si tiene pedidos; búsqueda y filtro por rol
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
  → Método de pago → Elegir (tarjeta, Nequi o efectivo)
  → Datos de pago → Pagar (crea el pedido con usuario y snapshot)
  → Confirmación de pago
```

## Rutas del proyecto

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | Home | Página principal |
| `/login` | Login | Inicio de sesión |
| `/register` | Register | Registro de usuario |
| `/cart` | Cart | Carrito de compras |
| `/address` | Address | Dirección de entrega |
| `/payment-method` | Payment Method | Selección de pago |
| `/payment-card` | Card Payment | Pago con tarjeta |
| `/payment-success` | Success | Confirmación |
| `/admin` | Admin | Panel administrativo |
| `/catalogo` | Catálogo | Listado con filtros por categoría |
| `/producto/:id` | Producto | Detalle de un producto |
| `/cuenta` | Cuenta | Panel de control del usuario |
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
