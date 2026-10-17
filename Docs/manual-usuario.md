# Manual de Usuario — Tienda Parque 100

**Plataforma de comercio electrónico para conjunto residencial**

| Campo | Valor |
|-------|-------|
| Documento | Manual de usuario |
| Versión del sistema | 1.6.0 |
| Fecha | Octubre de 2026 |
| Dirigido a | Clientes, administradores de la tienda y domiciliarios |

---

## Índice

1. [Introducción](#1-introducción)
2. [Requisitos y acceso](#2-requisitos-y-acceso)
3. [Roles del sistema](#3-roles-del-sistema)
4. [Primeros pasos](#4-primeros-pasos)
5. [Guía del cliente (comprador)](#5-guía-del-cliente-comprador)
6. [Guía del administrador](#6-guía-del-administrador)
7. [Guía del domiciliario](#7-guía-del-domiciliario)
8. [Estados de un pedido](#8-estados-de-un-pedido)
9. [Métodos de pago](#9-métodos-de-pago)
10. [Rutas de la aplicación](#10-rutas-de-la-aplicación)
11. [Preguntas frecuentes](#11-preguntas-frecuentes)
12. [Solución de problemas](#12-solución-de-problemas)
13. [Glosario](#13-glosario)
14. [Soporte y contacto](#14-soporte-y-contacto)

---

## 1. Introducción

**Tienda Parque 100** es una aplicación web de comercio electrónico pensada para que los residentes de un conjunto residencial compren productos frescos y de canasta familiar, y para que el negocio administre su inventario, pedidos, clientes y ventas desde un panel administrativo.

Este manual describe, paso a paso, **cómo usar la aplicación** desde el punto de vista del usuario final. Cubre tres perfiles —cliente, administrador y domiciliario—, el flujo completo de compra, la gestión del inventario y los pedidos, y las respuestas a las dudas más frecuentes.

No es un documento técnico: para la instalación, la arquitectura o el despliegue del sistema consulta el [manual técnico](manual-tecnico.md), la [arquitectura](arquitectura.md) y la [guía de despliegue](guia-despliegue.md).

---

## 2. Requisitos y acceso

La aplicación se ejecuta **en el navegador**: no requiere instalar ningún programa.

| Requisito | Detalle |
|-----------|---------|
| Navegador | Chrome, Edge o Firefox en versiones recientes (90+) |
| Conexión | Acceso a internet o a la red donde esté publicado el sistema |
| Dispositivo | Computador, tableta o teléfono (diseño adaptable) |
| Software adicional | Ninguno |

**Dirección de acceso:** la que proporcione el administrador del sistema (por ejemplo, el dominio público, o `http://localhost:5173` en un entorno de desarrollo/pruebas).

### Credenciales de prueba

Si estás explorando el sistema en un entorno de demostración, puedes usar estas cuentas (los datos son ficticios):

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Cliente | `usuario@ejemplo.com` | `12345678` |
| Administrador | `admin@parque100.com` | `admin123` |
| Domiciliario | `domiciliario@parque100.com` | `domiciliario123` |

---

## 3. Roles del sistema

El sistema reconoce tres roles. Cada uno ve únicamente las funciones que le corresponden.

| Rol | Puede hacer | No puede hacer |
|-----|-------------|----------------|
| **Cliente** | Navegar el catálogo, comprar, ver y cancelar sus pedidos, calificar productos | Entrar al panel de administración ni ver pedidos de otros |
| **Administrador** | Todo lo del cliente, además de gestionar inventario, pedidos, clientes, reportes y configuración | — |
| **Domiciliario** | Ver pedidos pendientes y administrar pedidos (avanzar estados y entregar) | Cancelar pedidos, gestionar inventario, clientes o reportes |

> Si un usuario sin permiso intenta abrir una ruta del panel de administración, el sistema lo redirige automáticamente al inicio.

---

## 4. Primeros pasos

### 4.1 Registro de una cuenta nueva

1. En la pantalla de inicio de sesión, pulsa **"Crear cuenta nueva"** (también puedes entrar a `/register`).
2. Completa **Información personal**:
   - **Nombre** y **Apellido** (obligatorios).
   - **Correo electrónico** (obligatorio; debe ser válido y único).
   - **Teléfono** (obligatorio; exactamente **10 dígitos**, solo números).
3. Completa **Seguridad**:
   - **Contraseña** (mínimo **8 caracteres**).
   - **Confirmar contraseña** (debe coincidir).
4. Marca la casilla de **Términos y Condiciones** y **Política de Privacidad** (obligatorio para habilitar el botón).
5. Pulsa **Registrarse**. Si todo es correcto, serás llevado a la pantalla de inicio de sesión.

**Mensajes de validación frecuentes:**

| Situación | Mensaje |
|-----------|---------|
| Correo con formato inválido | "Correo electrónico inválido" |
| Teléfono distinto de 10 dígitos | "Ingresa un número de teléfono de 10 dígitos" |
| Contraseña corta | "La contraseña debe tener al menos 8 caracteres" |
| Contraseñas distintas | "Las contraseñas no coinciden" |
| Correo ya registrado | "El correo electrónico ya está registrado" |
| Teléfono ya registrado | "El número de teléfono ya está registrado" |

### 4.2 Inicio de sesión

1. Abre la pantalla **Iniciar Sesión** (`/login`).
2. Escribe tu **correo** y **contraseña**.
3. Opcionalmente marca **"Recuérdame"** para mantener la sesión abierta entre visitas (si no lo marcas, la sesión solo dura mientras la pestaña esté abierta).
4. Pulsa **Iniciar sesión**.

Puedes mostrar u ocultar la contraseña con el **ícono del ojo**. Si ya estabas en una página que exige sesión (por ejemplo, el carrito), al iniciar sesión volverás automáticamente a esa página.

**Sesión de administrador:** en la parte inferior del formulario hay un enlace **"¿Eres administrador?"** que abre un modal de acceso administrativo con las mismas credenciales.

### 4.3 Recuperar contraseña

1. En el inicio de sesión, pulsa **"¿Olvidaste tu contraseña?"**.
2. Escribe el correo de la cuenta y pulsa **Generar clave temporal**.
3. El sistema mostrará un mensaje **neutro** (no revela si el correo existe ni muestra la clave). La clave temporal se entrega de forma manual por el administrador.

### 4.4 Cambiar de usuario (multisesión)

El sistema permite **tener varias cuentas abiertas a la vez** sin cerrar la anterior:

1. Abre el menú del usuario (avatar) y pulsa **"Cambiar de usuario"**.
2. Ingresa con la otra cuenta; la sesión anterior se mantiene.
3. En el mismo menú aparecerá la sección **"Otras sesiones activas"**, desde donde puedes alternar entre cuentas con un clic.
4. **"Cerrar sesión"** cierra únicamente la cuenta activa; las demás siguen disponibles.

### 4.5 La barra de navegación (navbar)

| Elemento | Para qué sirve |
|----------|----------------|
| **Logo Tienda Parque 100** | Volver a la página de inicio |
| **Inicio** | Página principal |
| **Categorías** | Baja a las categorías en el inicio (o navega a ellas desde otra página) |
| **Catálogo** | Listado completo de productos |
| **Buscador** | Buscar productos con sugerencias en vivo; `Enter` lleva al catálogo filtrado |
| **Corazón (favoritos)** | Lista de productos marcados como favoritos, con contador |
| **Carrito** | Carrito de compras, con contador de unidades |
| **Campana** | Notificaciones con el estado de tus pedidos (solo con sesión) |
| **Avatar / Iniciar Sesión** | Menú de usuario o acceso al login |

En pantallas pequeñas aparece un **menú hamburguesa** con las mismas opciones.

---

## 5. Guía del cliente (comprador)

### 5.1 Página de inicio (`/`)

- **Hero Banner:** ofertas destacadas; los botones **"Comprar ahora"** y **"Ver ofertas"** llevan al catálogo.
- **Categorías:** 8 categorías con ícono. Al pulsar una, se abre una ventana con los productos filtrados (imagen y nombre llevan al detalle). Si la categoría no tiene productos, muestra "Categoría sin productos". El botón **"Ver todas"** abre un panel con todas las categorías.
- **Productos Destacados:** cuadrícula con imagen, precio, botón de favorito y **"Añadir"** al carrito.
- **Oferta Especial:** banner promocional con acceso al catálogo.
- **Pie de página (footer):** enlaces a categorías, centro de ayuda, redes, privacidad/cookies y mapa del sitio.

### 5.2 Catálogo (`/catalogo`)

- Filtra por **categoría** con los chips superiores o por **búsqueda** desde el navbar (`?q=`).
- Ordena los resultados por **relevancia, precio o nombre**.
- La lista se pagina de **12 en 12**; mientras carga se muestran esqueletos (placeholders).
- Si no hay resultados, aparece un estado vacío con el botón **"Ver todos los productos"**.
- En cada tarjeta puedes marcar **favorito** o pulsar **"Añadir"** (requiere sesión y respeta el stock disponible).

### 5.3 Detalle del producto (`/producto/:id`)

- Ruta de navegación: **Catálogo › Categoría › Producto**.
- Muestra galería, categoría, precio, **stock disponible**, selector de **cantidad**, calificaciones y **productos relacionados** (clicables).
- El botón **"Añadir al carrito"** exige sesión: si no has iniciado, te redirige al login y luego vuelve aquí.

### 5.4 Favoritos (`/favoritos`)

- Los productos marcados con el corazón se guardan en tu dispositivo y se conservan entre visitas.
- El contador del navbar refleja cuántos tienes.
- Desde aquí puedes abrir el producto o añadirlo al carrito.

### 5.5 Carrito (`/cart`)

- Lista los productos agregados con imagen, nombre y precio unitario.
- **Persiste por cuenta**: si recargas la página, el carrito se mantiene (el carrito de un invitado es independiente).
- Ajusta cantidades con **+ / -**. El sistema **limita la cantidad al stock disponible** y avisa "Máx. disponibles".
- Puedes **eliminar** un producto y ver el **resumen** (subtotal, envío y total).
- Muestra **productos recomendados** según lo que llevas.
- El botón **"Continuar"** inicia el proceso de compra. Sin sesión, redirige al login.

> **Envío siempre sin costo:** el resumen muestra el envío en $0.

### 5.6 Proceso de compra

El flujo tiene cuatro pasos, con un **indicador de progreso** arriba (paso actual destacado) y un **resumen fijo** con la cantidad de productos y el total:

**Carrito → Dirección de entrega → Método de pago → Pago y confirmación.**

**a) Dirección de entrega (`/address`)**
1. Completa los **datos del destinatario** (nombre, apellido y **teléfono de 10 dígitos**).
2. Indica la **ubicación en el conjunto**: torre/bloque, piso y apartamento (solo números).
3. Agrega **notas adicionales** para el domiciliario (opcional).
4. Pulsa **Guardar dirección y continuar**.

**b) Método de pago (`/payment-method`)**

Elige una de las tres opciones:

| Método | Descripción |
|--------|-------------|
| **Tarjeta de crédito / débito** | Visa, Mastercard y American Express |
| **Nequi** | Transferencia con comprobante en imagen |
| **Efectivo contra entrega** | Pagas al recibir; la tienda lleva tu cambio |

**c) Pago (`/payment-card`)**

- **Tarjeta:** verás una vista previa de la tarjeta que se actualiza en tiempo real, con detección automática del tipo (Visa/Mastercard). Ingresa número (16 dígitos), titular, vencimiento (MM/AA) y CVV (3-4 dígitos). Pulsa **Pagar**; mientras se procesa aparece un indicador de "Procesando…".
- **Nequi** (`?method=nequi`): adjunta el **comprobante en imagen** (obligatorio, máximo **3 MB**). El botón se habilita solo cuando adjuntas el archivo.
- **Efectivo** (`?method=cash`): escribe el **monto con el que pagarás**. El sistema calcula **tu cambio en vivo** y exige que el monto cubra el total.

**d) Confirmación (`/payment-success`)**

- Muestra la animación de éxito, el **número de pedido** asignado y el botón **"Ver mi pedido"**.
- En efectivo, muestra lo recibido y el cambio.
- Incluye la línea de tiempo del estado del pedido y un aviso de posible demora en el despacho.

### 5.7 Mis compras y detalle del pedido (`/compras`, `/compras/:id`)

- **Historial:** cada tarjeta abre el detalle del pedido (con clic o teclado).
- **Detalle:** productos, totales, datos de entrega y **seguimiento (tracker)** del estado.
- **Campana de notificaciones:** muestra el estado de tus pedidos y enlaza directamente al detalle.

**Cancelar un pedido**
1. En un pedido en estado **Pendiente** o **Preparando**, pulsa **"Cancelar pedido"** (botón rojo).
2. Elige un **motivo** de la lista o escribe uno propio (obligatorio).
3. Lee el aviso de reembolso y pulsa **Confirmar**.
4. La cancelación **devuelve el stock** del pedido al inventario.

> No se pueden cancelar pedidos en estado **En envío** ni **Entregado** (el botón aparece deshabilitado).

**Dejar una reseña**
- Solo en pedidos **Entregados** aparece la opción **"Dejar una reseña"**.
- Califica con **1 a 5 estrellas** cada producto (obligatorio) y, si quieres, escribe un comentario (mínimo 10 y máximo 255 caracteres).
- También puedes **calificar el envío** desde el detalle del pedido.

### 5.8 Mi cuenta y perfil (`/cuenta`, `/perfil`, `/direccion`)

- **Mi cuenta:** panel con accesos a perfil, direcciones y compras, y opción de cerrar sesión.
- **Perfil:** edita tus datos (nombre, correo, teléfono) con el modo **Editar/Guardar**; los cambios se guardan realmente. También puedes **cambiar la contraseña**.
- **Dirección:** consulta y actualiza tu dirección de entrega habitual.

### 5.9 Páginas informativas

- **Centro de ayuda** (`/ayuda`): preguntas frecuentes en formato de acordeón.
- **Privacidad** (`/privacidad`), **Términos** (`/terminos`) y **Mapa del sitio** (`/mapa-sitio`).

---

## 6. Guía del administrador

El panel administrativo se abre desde el enlace **"Admin"** del navbar o entrando a `/admin`.

### 6.1 Acceso al panel

- Solo los usuarios con rol **administrador** pueden entrar; los demás roles son redirigidos al inicio.
- El panel tiene una **barra lateral colapsable** (se puede contraer para ganar espacio) y un botón **"Ver tienda"** para volver a la tienda.

### 6.2 Dashboard (`/admin`)

- **Estadísticas:** total de productos, en stock, bajo stock y sin stock.
- **Campana** con los pedidos pendientes reales y enlace al detalle.

### 6.3 Inventario (`/admin/inventario`)

- **Estadísticas rápidas:** total, en stock, bajo stock y sin stock (clicables para filtrar).
- **Tabla de productos** con búsqueda, filtro por estado y paginación.
- **Agregar producto:** modal con nombre, categoría, cantidad, precio e imagen. La imagen puede ser una **URL web** o un **archivo local** (con vista previa).
- **Editar producto:** abre el mismo modal con los datos precargados.
- **Eliminar producto:** confirmación directa (no se puede eliminar un producto que tenga pedidos asociados).
- **Importar / Exportar inventario:** botones para descargar el inventario y para cargar cambios de forma masiva.

### 6.4 Pedidos pendientes (`/admin/pedidos-pendientes`)

- Lista los pedidos por tomar.
- **"Tomar pedido"** cambia el estado de **Pendiente → Preparando**.
- Los pedidos en **efectivo** se destacan con el banner **"llevar cambio"** y una insignia.

### 6.5 Administrar pedidos (`/admin/pedidos`, `/admin/pedidos/:id`)

- Filtra y consulta pedidos por estado, con resumen por estado, **tracker compacto** y detalle con líneas del pedido.
- **Avanzar estado:** Pendiente → Preparando → En envío → Entregado (el cambio se guarda).
- **Cancelar pedido:** usa motivos **operativos** propios del administrador (distintos a los del cliente). Un pedido cancelado **no se puede reanudar**.
- En el detalle se muestra el **comprobante Nequi** cuando aplica y los avisos para pagos en efectivo.

### 6.6 Reportes (`/admin/reportes`)

- **Indicadores (KPIs):** ventas, pedidos, ticket promedio y entregados.
- **Filtros de período:** hoy, semana, mes o personalizado.
- **Pedidos por estado:** distribución visual.
- Las cifras de **ventas y ticket promedio excluyen los pedidos cancelados**.

### 6.7 Clientes (`/admin/clientes`)

- **CRUD de usuarios:** agregar, editar datos y **rol** (cliente, domiciliario, administrador) y eliminar.
- **Validaciones:** correo y teléfono son únicos (si ya existen, el sistema responde con error). No se puede eliminar un usuario que tenga pedidos.
- **Búsqueda y filtro por rol**.

### 6.8 Configuración (`/admin/configuracion`)

- Preferencias del panel (se guardan en tu dispositivo).
- Datos de la ficha del negocio (nombre, contacto, etc.).

---

## 7. Guía del domiciliario

El domiciliario accede con su cuenta y entra a la sección **"Pedidos"** del navbar (o a `/admin/pedidos-pendientes`).

Su barra lateral incluye únicamente:

- **Dashboard**
- **Pedidos pendientes**
- **Administrar pedidos**

Puede **tomar pedidos**, **avanzar los estados** y **marcar la entrega**. **No** puede cancelar pedidos ni acceder a inventario, clientes, reportes o configuración.

---

## 8. Estados de un pedido

| Estado en el sistema | Etiqueta visible | Significado |
|----------------------|------------------|-------------|
| `pendiente` | Pendiente | Pedido creado, aún no tomado por la tienda |
| `preparando` | En preparación | La tienda tomó el pedido y lo alista |
| `enviando` | En envío | El pedido salió a entrega |
| `entregado` | Entregado | El cliente recibió el pedido (habilita reseñas) |
| `cancelado` | Cancelado | Pedido anulado (devuelve el stock); no se reanuda |

**Seguimiento (tracker):** el detalle del pedido resalta el paso correspondiente al estado real.

> El sistema **no permite saltos ni retrocesos** de estado; toda transición inválida es rechazada.

---

## 9. Métodos de pago

| Método | Cómo funciona | Datos requeridos |
|--------|---------------|------------------|
| **Tarjeta** | Pago simulado con validación del número, titular, vencimiento y CVV | Nº de tarjeta (16 dígitos), titular, MM/AA, CVV |
| **Nequi** | Transferencia; se adjunta el comprobante | Imagen del comprobante (máx. 3 MB) |
| **Efectivo** | Se paga contra entrega; la tienda lleva el cambio | Monto con el que se pagará (≥ total) |

---

## 10. Rutas de la aplicación

| Ruta | Vista | Quién accede |
|------|-------|--------------|
| `/` | Inicio | Todos |
| `/login` · `/register` | Acceso y registro | Todos |
| `/catalogo` · `/producto/:id` | Catálogo y detalle | Todos |
| `/cart` | Carrito | Sesión |
| `/address` · `/payment-method` · `/payment-card` · `/payment-success` | Flujo de compra | Sesión |
| `/cuenta` · `/perfil` · `/direccion` | Cuenta y perfil | Sesión |
| `/compras` · `/compras/:id` | Historial y detalle de compras | Sesión |
| `/favoritos` | Favoritos | Sesión |
| `/ayuda` · `/privacidad` · `/terminos` · `/mapa-sitio` | Informativas | Todos |
| `/admin` | Dashboard | Administrador y domiciliario |
| `/admin/inventario` | Inventario | Administrador |
| `/admin/pedidos-pendientes` · `/admin/pedidos` · `/admin/pedidos/:id` | Gestión de pedidos | Administrador y domiciliario |
| `/admin/reportes` · `/admin/clientes` · `/admin/configuracion` | Reportes, clientes y configuración | Administrador |

---

## 11. Preguntas frecuentes

**¿Cómo compro?**
Explora el catálogo, agrega productos al carrito y confirma el pago siguiendo los pasos.

**¿Necesito crear una cuenta para comprar?**
Sí. Para agregar productos al carrito y comprar debes iniciar sesión (puedes registrarte gratis).

**¿Cuánto cuesta el envío?**
El envío es **siempre sin costo**. El tiempo estimado de entrega se muestra al crear el pedido (aproximadamente 45–60 minutos).

**¿Cómo sigo mi pedido?**
Inicia sesión y abre **"Mis compras"**, o usa la **campana** del navbar para ver el estado de cada pedido.

**¿Puedo cancelar un pedido?**
Sí, mientras esté en estado **Pendiente** o **Preparando**, indicando un motivo. Ya no es posible en **En envío** o **Entregado**.

**¿Cómo obtengo el reembolso de un pedido cancelado?**
Debes acordarlo directamente con el propietario de la tienda; el sistema muestra ese aviso al cancelar.

**¿Puedo calificar un producto?**
Sí, solo en pedidos **Entregados**, con 1 a 5 estrellas. El comentario es opcional.

**¿Olvidé mi contraseña, qué hago?**
Usa **"¿Olvidaste tu contraseña?"** en el login. El sistema confirma la solicitud de forma neutra y el administrador te entrega una clave temporal.

**¿Puedo usar varias cuentas al mismo tiempo?**
Sí, con **"Cambiar de usuario"** puedes mantener más de una sesión activa y alternar entre ellas.

**¿La app funciona en el celular?**
Sí, el diseño es adaptable a teléfonos y tabletas.

---

## 12. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| No aparece el botón "Añadir" o redirige al login | No has iniciado sesión | Inicia sesión; se te devolverá a la página anterior |
| "El correo/teléfono ya está registrado" | Ya existe una cuenta con esos datos | Usa otros datos o recupera tu cuenta |
| No puedo subir el comprobante de Nequi | La imagen supera los 3 MB o no es una imagen | Comprime la imagen o usa otro archivo (JPG/PNG) |
| "El monto debe cubrir el total" | El efectivo ingresado es menor al total | Ingresa un monto igual o mayor |
| El botón "Cancelar pedido" está deshabilitado | El pedido ya está en envío o entregado | El pedido ya no admite cancelación |
| No veo la opción "Dejar una reseña" | El pedido aún no está entregado | Espera a que el pedido se marque como **Entregado** |
| No entra al panel de administración | Tu cuenta no tiene rol de administrador | Solicita al administrador los permisos de acceso |
| La página se ve desactualizada | Caché del navegador | Recarga con `Ctrl + F5` |

---

## 13. Glosario

| Término | Significado |
|---------|-------------|
| **Catálogo** | Listado de productos disponibles para la venta |
| **Carrito** | Espacio donde se acumulan los productos antes de pagar |
| **Pedido** | Compra confirmada por un cliente, con su estado y seguimiento |
| **Estado del pedido** | Etapa del pedido: pendiente, preparando, enviando, entregado o cancelado |
| **Tracker** | Línea de tiempo que muestra el avance de un pedido |
| **Rol** | Perfil de permisos: cliente, administrador o domiciliario |
| **Domiciliario** | Persona que entrega los pedidos |
| **Comprobante** | Imagen que acredita el pago por Nequi |

---

## 14. Soporte y contacto

| Canal | Datos |
|-------|-------|
| Correo | info@parque100.com |
| Teléfono | (304) 606-8846 |
| Dirección | Carrera 100 #42f-100, Barranquilla |
| Centro de ayuda | Página `/ayuda` dentro de la aplicación |

> Para reportes de novedades de entrega hay un plazo de 24 horas desde la recepción, según la política indicada en el centro de ayuda.
