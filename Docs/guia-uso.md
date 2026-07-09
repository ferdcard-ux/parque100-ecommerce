# Guía de Uso

## Credenciales de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Usuario estándar | `usuario@ejemplo.com` | `12345678` |
| Administrador | `admin@parque100.com` | `admin123` |

## Funcionalidades por pantalla

### Inicio (`/`)
- **Hero Banner**: llamativo con ofertas del día y acceso rápido a login
- **Categorías**: 8 categorías con emoji único. Cada categoría es clickeable y abre un modal con los productos filtrados. Si la categoría no tiene productos, muestra mensaje "Categoría sin productos". Botón "Ver todas" abre un modal con las 8 categorías como botones funcionales
- **Productos Destacados**: cuadrícula con productos, cada uno con imagen única, precio y botón "Añadir" al carrito
- **Oferta Especial**: banner promocional con descuento
- **Footer**: enlaces a categorías, ayuda, contacto y redes sociales

### Login (`/login`)
- Inicio de sesión con correo y contraseña
- Botón **X** en la esquina superior derecha para cerrar y volver al inicio
- Opción "Recordarme"
- Enlace a registro de cuenta
- Modal de inicio de sesión para administradores (link "¿Eres administrador?")

### Navegación — Menú de usuario
- Al iniciar sesión, el botón "Iniciar Sesión" se reemplaza por un avatar con las iniciales del usuario
- Al hacer clic se despliega un menú con:
  - Nombre completo y correo electrónico
  - Badge "Administrador" si aplica
  - Opción "Cambiar de usuario" (navega al login)
  - Opción "Cerrar sesión" (desloguea y redirige al inicio)
- El menú se cierra al hacer clic fuera de él

### Registro (`/register`)
- Formulario con nombre, apellido, correo, contraseña y confirmación
- Validación de campos (correo válido, contraseña 8+ caracteres, coincidencia)
- Aceptación de términos y condiciones (requerido para enviar)

### Carrito (`/cart`)
- Lista de productos agregados con imagen, nombre, precio unitario
- Control de cantidad (+ / -) y eliminar producto
- Resumen del pedido con subtotal, envío y total
- Productos recomendados basados en el carrito actual
- Botón "Continuar" para iniciar el flujo de compra

### Dirección de entrega (`/address`)
- Formulario con datos del destinatario (nombre, apellido, teléfono)
- Ubicación en el conjunto (torre, piso, apartamento)
- Notas adicionales para el domiciliario
- Resumen del pedido y tiempo estimado de entrega

### Método de pago (`/payment-method`)
- Selección entre Tarjeta de crédito/débito (Visa, Mastercard, Amex) o Nequi
- Indicador de pago seguro SSL
- Resumen del pedido con total a pagar

### Pago con tarjeta (`/payment-card`)
- Preview visual de la tarjeta bancaria (actualiza en tiempo real)
- Campos: número de tarjeta, titular, fecha de vencimiento, CVV
- Detección automática del tipo de tarjeta (Visa/Mastercard)
- Indicador de procesamiento con spinner
- Confirmación de pago seguro

### Confirmación (`/payment-success`)
- Animación de éxito con icono de check
- Número de pedido generado automáticamente
- Timeline del estado del pedido
- Botón para volver a la tienda

### Panel Administrativo (`/admin`)
- Sidebar colapsable con navegación (Dashboard, Inventario, Pedidos, etc.)
- Botón **Inicio** para volver a la página principal
- Estadísticas: total productos, en stock, bajo stock, sin stock
- Tabla de productos con búsqueda, filtro por estado y paginación
- **CRUD completo**: agregar (modal con nombre, categoría, cantidad, precio, URL de imagen opcional), editar (modal precargado), eliminar (confirmación directa)
- Botones de importar/exportar inventario

## Flujo completo de compra

```
Inicio → Agregar productos al carrito
  → Carrito → Revisar y continuar
  → Dirección de entrega → Guardar
  → Método de pago → Elegir
  → Datos de tarjeta → Pagar
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
