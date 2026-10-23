# Guía de Despliegue — Servidor propio expuesto a Internet

Esta guía describe **el método de despliegue actual** del proyecto: usar un equipo Windows
como servidor, exponer los puertos **80/443** del router y publicar la tienda con **HTTPS
automático** bajo un dominio de **DuckDNS**, todo con herramientas **gratuitas**.

- **Alcance:** entorno de pruebas/demostración (equipo encendido, IP dinámica).
- **No es** un despliegue de producción con alta disponibilidad. Para eso, usar un host en la nube.
- El acceso del equipo está separado de las cuentas de demostración de la tienda. El aprovisionamiento de la base privada local se documenta internamente en el equipo.

---

## 1. Arquitectura

```
Internet ──► <IP pública>:80/:443 ──► Router (port forwarding) ──► PC (<IP local>)
   │
   └─► Caddy (TLS Let's Encrypt)
         ├── /         → dist/  (SPA con fallback a index.html)
         └── /api/*    → reverse_proxy 127.0.0.1:3001  (Express)
                                  └── MySQL 127.0.0.1:3306  (solo local)
```

**Principio clave — "mismo origen":** el frontend y la API se sirven bajo el **mismo
dominio**. El frontend compila con `VITE_API_URL=/api` y Caddy enruta `/api/*` al backend.
Así **no hay CORS** y el dominio no queda fijado en el bundle.

| Componente | Rol | Expuesto a Internet |
|---|---|---|
| Caddy | TLS + estáticos + reverse proxy | **Sí** (80/443) |
| Express | API (`/api`) | No (solo `127.0.0.1:3001`) |
| MySQL | Base de datos | No (solo `127.0.0.1:3306`) |
| DuckDNS | DNS dinámico | — |

---

## 2. Requisitos previos

| Requisito | Detalle |
|---|---|
| Equipo | Windows 10/11, que pueda quedar **encendido** |
| Node.js | v20+ (probado con v24) |
| MySQL | Servidor local funcionando (nativo o servicio) |
| Caddy | 2.7+ (probado con 2.11.7) |
| Cuenta DuckDNS | Gratuita (subdominio + token) |
| Router | Con **port forwarding** y **IP pública no compartida** (sin CGNAT) |
| Permisos | Administrador local (para firewall y servicios de Windows) |

> **Comprobar CGNAT:** si la IP que ve Internet **no** coincide con la IP de la interfaz WAN
> del router, su operador usa CGNAT y **este método no funcionará** (habría que usar un túnel).

---

## 3. Pasos

### Paso 1 — Reserva DHCP (IP local fija)

En el router, crear una **reserva DHCP** (Static Lease) por **MAC** → IP local fija
(p. ej. `192.168.1.3`). Esto evita que el reenvío se rompa si el router cambia de IP.

> Elige una IP **fuera** del rango del pool DHCP, o asígnala reservada.

### Paso 2 — Reenvío de puertos

En el router (`NAT → Port Mapping` o equivalente), crear **dos** reglas **TCP** apuntando al PC:

| Nombre | Puerto externo | IP interna | Puerto interno |
|---|---|---|---|
| HTTP | 80 | `<IP local>` | 80 |
| HTTPS | 443 | `<IP local>` | 443 |

Selecciona la **interfaz WAN** correcta (la que tiene la IP pública), no la interfaz LAN.

### Paso 3 — Firewall de Windows

```powershell
New-NetFirewallRule -DisplayName "Parque100 HTTP 80"  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80
New-NetFirewallRule -DisplayName "Parque100 HTTPS 443" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443
```

> Aplica a **todos los perfiles** (una red Wi-Fi puede clasificarse como "Public").
> **No** abras `3001` ni `3306`: deben quedar solo locales.

### Paso 4 — DNS dinámico (DuckDNS)

1. Crear el subdominio en <https://www.duckdns.org> y copiar el **token**.
2. Crea un archivo de configuración y un script de actualización (ejemplo):

`duckdns.conf`
```
DOMAIN=<subdominio>
TOKEN=<TU_TOKEN>
```

`duckdns-update.ps1`
```powershell
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$conf = @{}
foreach ($line in Get-Content (Join-Path $root 'duckdns.conf')) {
  if ($line -match '^\s*([^=]+)=(.*)$') { $conf[$Matches[1].Trim()] = $Matches[2].Trim() }
}
$url = "https://www.duckdns.org/update?domains=$($conf.DOMAIN)&token=$($conf.TOKEN)&ip="
"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $(Invoke-RestMethod -Uri $url -TimeoutSec 20)" |
  Out-File (Join-Path $root 'duckdns.log') -Append -Encoding utf8
```

3. Programar su ejecución **cada 5 min** (ver Paso 9). Comprueba la resolución:

```powershell
Resolve-DnsName <subdominio>.duckdns.org -Type A
```

### Paso 5 — Instalar Caddy

```powershell
winget install --id CaddyServer.Caddy -e
```

### Paso 6 — Compilar el frontend "mismo origen"

En la raíz del proyecto, crear `.env.production`:

```
VITE_API_URL=/api
```

Y compilar:

```powershell
npm run build
```

### Paso 7 — Variables de entorno del backend

Crear `.env` en la raíz del proyecto (no se versiona):

```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=parque100
SITE_ACCESS_DB_USER=p100_site_access
SITE_ACCESS_DB_PASSWORD=<generada localmente por access:provision>

JWT_SECRET=<minimo-32-caracteres-aleatorios>
JWT_EXPIRES_IN=8h
PAYMENTS_MODE=disabled

CORS_ORIGIN=https://<subdominio>.duckdns.org,http://localhost:5173,http://127.0.0.1:5173
```

`PAYMENTS_MODE` acepta `disabled` (predeterminado si se omite) o `demo`.
Antes de habilitar `demo` en una base `parque100` existente, ejecuta
`npm run migrate:demo-payments` con una cuenta MySQL autorizada para crear la
tabla `transacciones_pago_demo`. La migración no modifica la base privada
`parque100_acceso`. El panel de servicios no ejecuta migraciones de BD al
reiniciar el servidor; aplica esta migración antes de reiniciar/publicar el
backend. `setup.sql` ya incluye la tabla para instalaciones nuevas.

En una base `parque100` existente, ejecuta `npm run migrate:product-catalogs`
antes de iniciar la versión actualizada. Esta migración crea el catálogo de
unidades y conserva/precarga las unidades ya usadas por productos; también
amplía el campo de unidad a 30 caracteres. No modifica la base privada
`parque100_acceso`. Las altas, ediciones y eliminaciones de categorías/unidades
se gestionan desde **Admin → Inventario**; las categorías con productos y las
unidades aún utilizadas no se pueden eliminar.

Usa `demo` solo en un entorno académico: el flujo por pasos de tarjeta y Nequi
no solicita ni almacena datos financieros y no se conecta con proveedores. Al
confirmar, guarda una transacción identificada como DEMO, crea el pedido y
descuenta inventario en una sola transacción SQL. El personal puede avanzar los
estados demostrativos; al cancelar antes de la entrega se restablece el stock y
se marca la transacción como anulada DEMO. Ninguna de estas operaciones implica
un pago, una compra o un despacho reales. Para cualquier despliegue productivo,
mantén `PAYMENTS_MODE=disabled` hasta integrar y verificar una pasarela real.

`SITE_ACCESS_DB_USER` y `SITE_ACCESS_DB_PASSWORD` pertenecen a la base privada
`parque100_acceso`, no a la base de demostración. Se generan únicamente en el
equipo local con `npm run access:provision`; no copies sus credenciales ni sus
datos al repositorio o a un dump compartido.

MySQL debe escuchar solo en `127.0.0.1` para los protocolos clásico y X
(`--bind-address=127.0.0.1 --mysqlx-bind-address=127.0.0.1`). No habilites
reglas de entrada del firewall para `mysqld` ni publiques los puertos 3306/33060.
El panel de servicios aplica estos límites tanto al arranque local como al
servicio del servidor en red. Para producción, sustituye `root` y la contraseña
vacía por una cuenta exclusiva de la aplicación con privilegios mínimos.

> Genera el `JWT_SECRET` con un generador criptografico, por ejemplo:
> `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`

El backend registra acciones principales de usuarios en
`server\logs\site-activity.jsonl` (máximo 5 MB más una rotación local).
El log contiene la identidad académica autenticada, el ID/rol de tienda si
corresponde, la acción y el resultado HTTP; incluye también eventos permitidos
del carrito, favoritos y cierre de sesión. Excluye credenciales, contenido
enviado, direcciones IP y datos de pago. Está excluido del repositorio. La
pestaña **ACTIVIDAD WEB** del panel muestra el archivo actualizado cada cuatro
segundos; despliega el backend actualizado y reinícialo para habilitar el
registro. No se requiere migración de base de datos.

### Paso 8 — Caddyfile

Ubicación: `C:\ProgramData\Parque100\conf\Caddyfile` (carpeta que solo pueden
modificar los Administradores; ver Paso 9):

```
{
	email admin@<subdominio>.duckdns.org
	storage file_system C:/ProgramData/Parque100/caddy-data
	# Sin API de administración: los cambios se aplican reiniciando el servicio.
	admin off
	persist_config off
}

<subdominio>.duckdns.org {
	encode gzip

	log {
		output file C:/ProgramData/Parque100/logs/caddy-access.log {
			roll_size 10MiB
			roll_keep 5
		}
		format json
	}

	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		Permissions-Policy "camera=(), microphone=(), geolocation=()"
		Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
		-Server
	}

	handle /api/* {
		reverse_proxy 127.0.0.1:3001
	}

	# Página pública de acceso y su script (sin scripts en línea por la CSP)
	@access path /access.html /access.js
	handle @access {
		root * C:/ProgramData/Parque100/app/dist
		file_server
	}

	handle {
		route {
			forward_auth 127.0.0.1:3001 {
				uri /api/site-access/proxy-access
			}
			root * C:/ProgramData/Parque100/app/dist
			try_files {path} /index.html
			file_server
		}
	}
}
```

- **CSP:** las imágenes se admiten desde cualquier origen HTTPS (`img-src … https:`)
  porque el administrador puede usar URL de imagen de cualquier tienda o CDN; una
  imagen `http://` (sin TLS) se bloquea. Los scripts solo se cargan desde el
  propio sitio: si se agrega un script externo hay que incluirlo en `script-src`
  (consola: *Refused to load…*). `access.html` no debe contener scripts en línea.
- **Registro de accesos:** guarda IP, ruta y código HTTP para investigar
  incidentes; Caddy oculta por defecto `Cookie` y `Authorization`.

El `route` es necesario para que `forward_auth` reciba la ruta original antes de
que `try_files` aplique el fallback a `index.html`; de lo contrario, al iniciar
sesión desde una ruta profunda, el navegador puede volver a `/index.html` y
React Router mostrar un 404. La carga de datos de la tienda empieza después de
la aceptación del descargo, evitando solicitudes API prematuras rechazadas por
el gate de consentimiento. Las pestañas antiguas en `/index.html?next=...`
también redirigen de forma segura a su destino interno.

Antes de reiniciar backend o recargar Caddy, aprovisiona `parque100_acceso` y
crea las cuentas autorizadas desde una terminal local interactiva, siguiendo
el documento interno de acceso académico del equipo. Publica luego el build que incluye
`dist/access.html`. El forward-auth protege el frontend; el backend también
exige la aceptación del descargo antes de servir las APIs.

> **Correo:** usa uno del propio dominio (p. ej. `admin@<subdominio>.duckdns.org`).
> Let's Encrypt **rechaza** dominios reservados como `example.com`.

### Paso 9 — Arranque y automatización

**Arranque manual** (para probar):

```powershell
# 1) Base de datos (si es portable: mysqld --datadir=...)
# 2) Backend
node server/index.js
# 3) Caddy
caddy run --config C:\parque100-server\Caddyfile --adapter caddyfile
```

**Servicios NSSM endurecidos (inicio manual)** — el servidor usa cuatro servicios de
Windows administrados por **NSSM**, en **inicio manual (`SERVICE_DEMAND_START`)**. Desde el
22/10/2026 se ejecutan con **cuentas virtuales sin privilegios** (`NT SERVICE\<servicio>`,
nunca `LocalSystem`) y todo lo que ejecutan vive en `C:\ProgramData\Parque100`, carpeta que
solo pueden modificar Administradores y SYSTEM:

```
C:\ProgramData\Parque100├── bin\        nssm.exe, caddy.exe
├── scripts\    control-server.ps1, duckdns-service.ps1, duckdns-update.ps1
├── conf\       Caddyfile, duckdns.conf (token: solo Admin/SYSTEM/servicio DDNS)
├── app\        copia desplegada: server\, node_modules\, dist\, .env propio
│   └── server\logs\   registro de actividad (escritura solo del backend)
├── caddy-data\ certificados y claves TLS (solo Caddy y Administradores)
└── logs\       registros de los servicios (lectura para Usuarios)
```

| Servicio | Programa | Cuenta | Escritura permitida |
|---|---|---|---|
| `Parque100-MySQL` | `mysqld.exe` (Program Files) | `NT SERVICE\Parque100-MySQL` | datadir, `logs\` |
| `Parque100-Backend` | `node.exe server\index.js` en `app\` | `NT SERVICE\Parque100-Backend` | `app\server\logs\`, `logs\` |
| `Parque100-Caddy` | `bin\caddy.exe run --config conf\Caddyfile` | `NT SERVICE\Parque100-Caddy` | `caddy-data\`, `logs\` |
| `Parque100-DDNS` | `powershell -File scripts\duckdns-service.ps1` | `NT SERVICE\Parque100-DDNS` | `logs\` |

Además, cada servicio solo conserva los privilegios `SeChangeNotifyPrivilege` y
`SeCreateGlobalPrivilege` (`sc.exe privs`), lo que impide escalar a SYSTEM aunque
se comprometa el proceso. El backend se conecta a MySQL con la cuenta `p100_app`
(solo `SELECT/INSERT/UPDATE/DELETE` sobre `parque100`) y `root` tiene contraseña.

Instalación (PowerShell como administrador, scripts fuera del repositorio):

1. `install-servicios.ps1` registra los servicios (instalación nueva).
2. `endurecer-servidor.ps1` crea `C:\ProgramData\Parque100`, copia binarios, scripts y la
   aplicación, aplica permisos, cambia las cuentas de servicio y verifica el arranque.
   `revertir-endurecimiento.ps1` deshace el cambio si fuera necesario.

Operación (solo `control-server.ps1`, con acciones fijas):

```powershell
$cs = 'C:\ProgramData\Parque100\scripts\control-server.ps1'
powershell -NoProfile -ExecutionPolicy Bypass -File $cs status          # sin privilegios
powershell -NoProfile -ExecutionPolicy Bypass -File $cs start           # como administrador
powershell -NoProfile -ExecutionPolicy Bypass -File $cs restart-caddy   # aplica el Caddyfile
powershell -NoProfile -ExecutionPolicy Bypass -File $cs deploy          # publica (ver §5)
```

> **Esquema anterior:** `install-tareas.ps1` (tareas como SYSTEM) **no debe usarse**.

### Paso 10 — Energía (evitar que se duerma)

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0
powercfg /change disk-timeout-ac 0
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT
```

---

## 4. Verificación

```powershell
# Puertos escuchando
Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 80,443,3001,3306

# DNS
Resolve-DnsName <subdominio>.duckdns.org -Type A

# API y sitio (desde el propio PC)
Invoke-WebRequest https://<subdominio>.duckdns.org/api/products -UseBasicParsing

# Certificado emitido (log de Caddy)
Select-String -Path C:\ProgramData\Parque100\logs\caddy.err.log -Pattern 'certificate obtained successfully'

# Batería de la app
node scripts/smoke-lote2.mjs
```

Comprobar además el acceso **desde fuera** (otra red/dispositivo) abriendo
`https://<subdominio>.duckdns.org/`.

---

## 5. Operación diaria

```powershell
$cs = 'C:\ProgramData\Parque100\scripts\control-server.ps1'
# Estado y registros (sin privilegios)
powershell -NoProfile -ExecutionPolicy Bypass -File $cs status
powershell -NoProfile -ExecutionPolicy Bypass -File $cs logs

# Publicar cambios (frontend y/o backend)
npm run build                      # 1) SIN privilegios, en el repositorio
powershell -NoProfile -ExecutionPolicy Bypass -File $cs deploy   # 2) como administrador
```

- `deploy` copia `dist\`, `server\` y `node_modules\` del repositorio a `app\` (sin seguir
  enlaces ni uniones) y reinicia el backend solo si cambió su código. Nunca ejecuta
  `npm` ni scripts del repositorio con privilegios.
- Cambios en la configuración del backend: editar `C:\ProgramData\Parque100pp\.env`
  (como administrador) y ejecutar `restart-backend`. El `.env` del repositorio es solo
  para desarrollo y tiene su propio `JWT_SECRET`.
- Cambios en el Caddyfile: editar `conf\Caddyfile` y ejecutar `restart-caddy` (corte de 2–3 s).
- El panel de escritorio ejecuta estas mismas acciones pidiendo UAC en cada una.

---

## 6. Solución de problemas (casos reales)

| Síntoma | Causa | Solución |
|---|---|---|
| Caddy no obtiene certificado | El correo ACME es un dominio reservado (`example.com`) → Let's Encrypt lo rechaza | Usar un correo del propio dominio (`admin@<subdominio>.duckdns.org`) |
| Caddy no arranca / puerto ocupado | Otro proceso en `:80` (p. ej. un servidor de prueba) | Detener ese proceso antes de arrancar Caddy |
| El sitio abre pero la API falla (CORS / rutas) | El frontend se compiló sin `VITE_API_URL=/api` | Recompilar con `.env.production` |
| Login responde `401` aunque las credenciales sean correctas | El backend espera `Correo`/`Contrasena`, no `email`/`password` | Enviar los nombres de campo correctos |
| `mysqld` no arranca como servicio | Instalación **portable** sin servicio | Ejecutar `mysqld.exe --datadir=<datadir>` (o registrarlo como servicio) |
| El backend no arranca tras el endurecimiento | La cuenta `NT SERVICE\Parque100-Backend` no puede leer `app\.env` o escribir `app\server\logs` | Revisar `logsackend.err.log` y reaplicar `endurecer-servidor.ps1` (es idempotente) |
| Caddy no arranca tras el endurecimiento | Sin escritura en `caddy-data\` o `logs\` | Revisar `logs\caddy.err.log` y los permisos de esas carpetas |
| Una imagen o script no carga y la consola dice *Refused to load* | La CSP no incluye ese origen | Añadir el origen a la directiva correspondiente del Caddyfile y `restart-caddy` |
| El dominio no resuelve o apunta a IP vieja | DuckDNS no actualizado | Verificar `logs\duckdns.log` y el servicio `Parque100-DDNS` |
| No entra desde fuera | CGNAT, reenvío mal configurado o firewall | Verificar IP WAN vs. pública; revisar Port Mapping (interfaz WAN) y reglas de firewall |

---

## 7. Seguridad y mantenimiento

- **Mantén cerrados** `3001` (API) y `3306` (MySQL); solo Caddy habla con ellos.
- Ningún servicio corre como SYSTEM ni ejecuta archivos del perfil de usuario (§3, Paso 9).
- Migraciones y restauraciones de BD usan `DB_ADMIN_USER`/`DB_ADMIN_PASSWORD` definidos
  en la terminal. `db:restore` se bloquea en el equipo servidor (requiere
  `--confirmar-servidor`) y `db:dump` sustituye las contraseñas por claves de
  desarrollo antes de escribir el archivo versionado.
- El cambio de contraseña de tienda exige sesión y deja sin efecto los tokens anteriores;
  los pedidos tienen topes (`ORDER_MAX_UNITS_PER_PRODUCT`=50, `ORDER_MAX_PENDING`=5 y
  20 pedidos por cuenta de acceso cada 15 min).
- Usa el dominio HTTPS con un certificado válido para todo acceso remoto. El
  modo local (`http://localhost`) es solo para desarrollo y no cifra con TLS;
  no expongas Vite ni Express directamente a redes públicas.
- Los logins de tienda y de acceso académico tienen límites independientes:
  hasta 30 respuestas HTTP 401 por IP en 15 minutos. Las autenticaciones
  exitosas no consumen intentos. Un 429 indica que se alcanzó el límite de ese
  flujo; espera a que termine la ventana para volver a probar.
- Usa un **`JWT_SECRET`** aleatorio de al menos 32 caracteres y **no** lo subas al repositorio. El backend no inicia si falta o es demasiado corto.
- Express escucha unicamente en `127.0.0.1`; Caddy debe ejecutarse en el mismo servidor y ser el unico punto de entrada publico.
- Express confia unicamente en proxies de loopback para obtener la IP cliente de Caddy; no amplíes `trust proxy` a redes no confiables.
- El **token de DuckDNS** y los `.env` son **secretos**: nunca al control de versiones.
  En el servidor viven en `conf\` y `app\` con permisos restringidos.
- **Windows Update** puede reiniciar el equipo: programa las actualizaciones fuera de las horas de demo.
- El frontend ya exige una cuenta académica autorizada y la aceptación del
  descargo. Para defensa en profundidad puede añadirse una capa perimetral
  (Cloudflare Access o *basic-auth*) delante de Caddy, sin sustituir la
  autorización propia del backend.
- Si cambia la **MAC** de red (p. ej. pasar de Wi-Fi a cable): rehacer la reserva DHCP y revisar el reenvío.
- Let's Encrypt **renueva** el certificado automáticamente; no requiere intervención.

---

> ¿Necesitas el detalle narrativo completo del montaje (incluidas las pruebas descartadas y
> las capturas de pantalla de cada paso)? Ese informe es **interno** y se guarda fuera del
> repositorio, en `C:\Users\migue\parque100-server\documentacion\`.
