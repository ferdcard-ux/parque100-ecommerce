# Parque 100-movil (Fork Android)

Fork Android no externo de Tienda Parque 100, derivado del proyecto web
`New_P100-Figma` (React + Node). Adapta la autenticación del proyecto
original a aplicación nativa con base de datos local.

> Las evidencias académicas (capturas, APK, documento `EVIDENCIAS.md`)
> viven en `Docs/movil/` de la rama `main` y no forman parte de esta rama.

## Ficha técnica

| Campo | Valor |
|---|---|
| Nombre de la aplicación | Parque 100-movil |
| Paquete | `com.parque100.movil` |
| Lenguaje | Kotlin 1.9.23 |
| Mínimo Android | 12 (API 31) |
| Objetivo / compilación | API 35 |
| Versión | 1.0 (versionCode 1) |
| UI | ConstraintLayout + Material3 (temas claro/oscuro) |
| Datos | SQLite local (`parque100.db`, tabla `usuarios`) |

## Estructura

```
settings.gradle.kts / build.gradle.kts / gradle.properties
gradle/wrapper/ + gradlew / gradlew.bat
app/
├── build.gradle.kts
└── src/main/
    ├── AndroidManifest.xml
    ├── java/com/parque100/movil/
    │   ├── MainActivity.kt        # Login, edge-to-edge, mensajes de estado
    │   └── db/DatabaseHelper.kt   # SQLite y validación de credenciales
    └── res/
        ├── layout/activity_main.xml
        ├── values/{strings,colors,themes}.xml
        ├── values-night/{colors,themes}.xml
        └── mipmap-*/ic_launcher*.png
docs/BITACORA.md                  # Registro interno (no versionado)
```

## Requisitos

- JDK 17 (`/usr/lib/jvm/java-17-openjdk-amd64`) con `jlink`
- Android SDK (`ANDROID_HOME`) con plataforma 35 y build-tools 35
- Dispositivo o emulador con Android 12+ y ADB

## Compilación

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/home/ferdcard/Android/Sdk
./gradlew :app:assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

## Instalación y prueba

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.parque100.movil/.MainActivity
adb exec-out screencap -p > captura.png
```

| Usuario | Correo | Contraseña |
|---|---|---|
| Demo | `usuario@ejemplo.com` | `12345678` |
| Admin | `admin@parque100.com` | `admin123` |

Mensajes: `¡Acceso correcto! Bienvenido — <nombre>` en éxito y
`Credenciales incorrectas` en fallo, además de `Toast`/`Snackbar`.

## Notas

- En Android 15 el sistema impone edge-to-edge: las barras son
  transparentes y los insets se aplican como padding en `MainActivity`.
- El formulario usa `ScrollView` para adaptarse a pantallas pequeñas
  y al teclado (`windowSoftInputMode="adjustResize"`).
- Detalle cronológico del desarrollo en `parque100-movil/docs/BITACORA.md`
  del repositorio principal (documento interno, excluido de esta rama).
