# Bitácora de Desarrollo — Parque 100-movil (Fork Android)

> **Propósito:** Registro cronológico de todas las implementaciones, correcciones y decisiones técnicas del Fork Android `Parque 100-movil`, derivado del proyecto web `New_P100-Figma` (Tienda Parque 100). Fork no externo ubicado en `parque100-movil/` dentro del mismo repositorio.

---

## 1. Creación del Fork Android — Proyecto Parque 100-movil (Evidencia 1, puntos 7 y 8)

### Implementación
- Creación de proyecto Gradle Android sin Android Studio, como fork interno en `parque100-movil/` (no `fork` externo en GitHub).
- Estructura inicial:
  - `parque100-movil/settings.gradle.kts`: `rootProject.name = "Parque 100-movil"`, `include(":app")`, `pluginManagement` con `google()`/`mavenCentral()`.
  - `parque100-movil/build.gradle.kts`: plugins `com.android.application` 8.7.3 y `org.jetbrains.kotlin.android` 1.9.23 en `apply false`.
  - `parque100-movil/app/build.gradle.kts`: `namespace = "com.parque100.movil"`, `compileSdk = 35`, `defaultConfig { applicationId = "com.parque100.movil", minSdk = 31, targetSdk = 35, versionCode = 1, versionName = "1.0" }`, `compileOptions`/`kotlinOptions` Java 17, `viewBinding = true`, dependencias `core-ktx:1.13.1`, `appcompat:1.7.0`, `material:1.12.0`, `constraintlayout:2.1.4`.
  - `parque100-movil/gradle.properties`: `org.gradle.jvmargs=-Xmx2048m`, `android.useAndroidX=true`, `android.nonTransitiveRClass=true`.
  - `parque100-movil/gradle/wrapper/gradle-wrapper.properties`: `distributionUrl=https://services.gradle.org/distributions/gradle-8.9-bin.zip`, `gradle-wrapper.jar` 43 KB de `github.com/gradle/gradle/raw/v8.9.0/gradle/wrapper/gradle-wrapper.jar`, `gradlew`/`gradlew.bat` con `chmod +x`.
- **Lenguaje (Evidencia 1, punto 8.3):** Kotlin elegido como más conveniente. Proyecto web origen en React 18 + TypeScript; Kotlin es oficial Android, interoperable con Java, conciso, soporte ViewBinding/SQLite, reduce boilerplate vs `src/views/components/auth/LoginForm.tsx` y `src/services/auth.service.ts`. Alternativa Java descartada por verbosidad.
- **Paquete y versión mínima (Evidencia 1, puntos 8.2 y 8.4):** `com.parque100.movil` y `minSdk = 31` (Android 12) verificados con `aapt dump badging` → `sdkVersion:'31'` y dispositivo de prueba `moto g22` API 31.

### Resultado verificado
`ls -R parque100-movil/app/src/main` confirma árbol `AndroidManifest.xml`, `java/com/parque100/movil/`, `res/{layout,values,mipmap-*}`. `aapt dump badging` y `apkanalyzer manifest print` confirman `package` y `minSdkVersion="31"`.

### Versión publicada
- 1.0 (versionCode 1). Fork creado en `parque100-movil/` commit inicial del módulo Android.

---

## 2. Adaptación de Iconografía — tienda_parque100.jpg (Evidencia 1, punto 8.5)

### Implementación
- Origen: `/home/ferdcard/Descargas/tienda_parque100.jpg` (JPEG JFIF 512×512, 43 KB).
- Adaptación vía Python Pillow 10.2.0 (`Image.LANCZOS`):
  ```python
  from PIL import Image
  img = Image.open("/home/ferdcard/Descargas/tienda_parque100.jpg").convert("RGBA")
  for name,size in {"mipmap-mdpi":48,"mipmap-hdpi":72,"mipmap-xhdpi":96,"mipmap-xxhdpi":144,"mipmap-xxxhdpi":192}.items():
      img.resize((size,size), Image.LANCZOS).save(f"/tmp/icons_out/{name}.png","PNG")
  ```
- Copia a `parque100-movil/app/src/main/res/mipmap-*/ic_launcher.png` y `ic_launcher_round.png` (mismo PNG redondo provisional, 4.8 KB mdpi a 44 KB xxxhdpi).
- Referencia en `AndroidManifest.xml:7` → `android:icon="@mipmap/ic_launcher"` `android:roundIcon="@mipmap/ic_launcher_round"`.

### Resultado verificado
`ls -lh app/src/main/res/mipmap-*/` muestra 5 densidades con tamaños correctos. `aapt dump badging` → `application-label:'Parque 100-movil'` y `apk` contiene iconos.

### Versión publicada
- 1.0 (versionCode 1). Iconografía integrada.

---

## 3. Configuración de Actividad Principal y Mensaje Visible (Evidencia 1, puntos 9 y 10)

### Implementación
- `parque100-movil/app/src/main/AndroidManifest.xml:7-18`: `<application android:label="@string/app_name" android:theme="@style/Theme.Parque100">` + `<activity android:name=".MainActivity" exported="true"><intent-filter><action MAIN/><category LAUNCHER/></intent-filter></activity>`.
- `parque100-movil/app/src/main/java/com/parque100/movil/MainActivity.kt:26-80`: `AppCompatActivity`, `ActivityMainBinding.inflate`, `setContentView(binding.root)`, `dbHelper = DatabaseHelper(this)`, `btnLogin.setOnClickListener` con validación y `mostrarMensaje()`.
- `parque100-movil/app/src/main/res/values/themes.xml:3`: `Theme.Parque100` parent `Theme.Material3.DayNight`, `colorPrimary #C62828`, `colorPrimaryDark #B71C1C`, `colorAccent #FBC02D`.
- Mensaje visible `parque100-movil/app/src/main/res/layout/activity_main.xml:29-40`: `TextView id/txtWelcome` `text="@string/welcome_message"` 22sp bold `#C62828` + `txtSubtitle` `text="@string/info_original"` 13sp.
- `parque100-movil/app/src/main/res/values/strings.xml:3`: `<string name="welcome_message">Bienvenido a Parque 100-movil</string>`.

### Resultado verificado
`adb shell uiautomator dump` → `node text="Bienvenido a Parque 100-movil" resource-id="com.parque100.movil:id/txtWelcome" bounds="[42,462][678,515]"`. `adb exec-out screencap -p` → `Docs/movil/captura_interfaz_inicial.png` 105 KB 720×1600 muestra mensaje centrado.

### Versión publicada
- 1.0 (versionCode 1). Actividad y mensaje verificados en `moto g22`.

---

## 4. Verificación de Estructura Android — Manifest, Kotlin, Res, Gradle (Evidencia 2, puntos 3 y 4)

### Implementación
- Estructura estándar creada y verificada con `ls -R`, `aapt`, `apkanalyzer` (ver capturas `Docs/movil/04_*.png`):
  - **Manifest** `app/src/main/AndroidManifest.xml:1`
  - **Kotlin** `app/src/main/java/com/parque100/movil/` (`MainActivity.kt:26`, `db/DatabaseHelper.kt:14`)
  - **Res** `app/src/main/res/` (`layout/activity_main.xml:7`, `values/{strings,colors,themes}.xml:1`, `mipmap-*/`)
  - **Gradle** `settings.gradle.kts:1`, `build.gradle.kts:1`, `app/build.gradle.kts:1`, `gradle.properties:1`, `gradle/wrapper/`

### Resultado verificado
Capturas sintéticas `04_manifest.png` (75 KB), `04_kotlin.png` (173 KB), `04_res.png` (156 KB), `04_gradle.png` (170 KB) generadas vía Pillow desde contenido real. `aapt dump badging` y `apkanalyzer manifest print` confirman `minSdkVersion="31"` y `MainActivity` LAUNCHER. Tabla de funciones documentada en `Docs/movil/EVIDENCIAS.md:4`.

### Versión publicada
- 1.0 (versionCode 1). Estructura validada.

---

## 5. Selección de ConstraintLayout e Interfaz de Autenticación (Evidencia 2, puntos 5, 6, 7 y 8)

### Implementación
- **Layout elegido (punto 5):** `ConstraintLayout` `app/src/main/res/layout/activity_main.xml:7` `androidx.constraintlayout.widget.ConstraintLayout`. Comentario `activity_main.xml:1-8` justifica elección. Descartados `Linear` (anidamiento) y `Table` (rígido).
- **Interfaz autenticación (punto 6):** `activity_main.xml` Card central `MaterialCardView` `app:cardCornerRadius="16dp"` con `ConstraintLayout` interno 20dp padding.
- **Campos (punto 7):** `TextInputLayout`+`TextInputEditText` → `tilUser/etUser` `inputType="textEmailAddress"` `hint="@string/hint_user"` `startIcon ic_menu_myplaces`; `tilPassword/etPassword` `inputType="textPassword"` `hint="@string/hint_password"` `passwordToggleEnabled="true"` `startIcon ic_lock_idle_lock`. Bounds verificados `etUser [77,742][643,840]` `etPassword [77,870][643,968]`.
- **Botón (punto 8):** `MaterialButton id/btnLogin` `text="@string/btn_login"` ("Iniciar sesión") `height 56dp` `cornerRadius 12dp` `backgroundTint @color/primary` `bounds [77,1009][643,1101]` `app/src/main/res/layout/activity_main.xml:101-112`.

### Resultado verificado
`Docs/movil/13_interfaz.png` (91 KB) y `captura_interfaz_inicial.png` muestran UI completa. `uiautomator dump` confirma IDs y `txtMessage` inicialmente `gone`.

### Versión publicada
- 1.0 (versionCode 1). Interfaz con ConstraintLayout probada en 720×1600.

---

## 6. Base de Datos SQLite y Validación de Credenciales (Evidencia 2, puntos 9, 10 y 11)

### Implementación
- `parque100-movil/app/src/main/java/com/parque100/movil/db/DatabaseHelper.kt:21-108`:
  - `class DatabaseHelper : SQLiteOpenHelper(parque100.db,1)` con `TABLE_USUARIOS="usuarios"`, `COL_ID`, `COL_EMAIL`, `COL_PASSWORD`, `COL_NOMBRE`, `COL_ROL`.
  - `onCreate`: `CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, nombre TEXT, rol TEXT DEFAULT 'usuario')` + `insertUser` semillas `usuario@ejemplo.com/12345678` y `admin@parque100.com/admin123` (alineadas con `README.md` web).
  - `onUpgrade`: `DROP TABLE IF EXISTS` + `onCreate`.
  - `validarCredenciales(email,password):Boolean` `DatabaseHelper.kt:80-90`: `rawQuery("SELECT id FROM usuarios WHERE email=? AND password=? LIMIT 1", arrayOf(email.trim(),password))` con `?` para prevenir inyección, `cursor.count>0`.
  - `obtenerNombre(email):String?` para mensaje personalizado.
- `parque100-movil/app/src/main/java/com/parque100/movil/MainActivity.kt:41-63`: `btnLogin.setOnClickListener` valida `email.isEmpty()||password.isEmpty()` → `msg_empty_fields`, llama `dbHelper.validarCredenciales`, si `valido` → `mostrarMensaje(msg_login_success — nombre)` verde + `Snackbar`, else → `msg_login_failed` rojo.
- `parque100-movil/app/src/main/res/values/strings.xml:6-8`: `msg_empty_fields`, `msg_login_success`, `msg_login_failed`; `colors.xml:7-8`: `success #2E7D32`, `error #D32F2F`; `activity_main.xml:88-98`: `txtMessage` `visibility="gone"`.

### Resultado verificado
`MainActivity.class` y `DatabaseHelper.class` generados en `app/build/tmp/kotlin-classes/debug/` (5.9 KB). `uiautomator dump` tras login muestra `etUser="usuario@ejemplo.com"`. `mostrarMensaje` cambia `visibility VISIBLE` y `setTextColor` vía `ContextCompat`. `Toast` y `Snackbar` para feedback adicional (E2-11).

### Versión publicada
- 1.0 (versionCode 1). BD y validación funcionales.

---

## 7. Hotfix — Fallos de compilación por Kotlin daemon y jlink (Evidencia 2, punto 14)

### Contexto
Build inicial `./gradlew assembleDebug` con `GRADLE_USER_HOME` y `ANDROID_HOME=/home/ferdcard/Android/Sdk`, Gradle 8.9, AGP 8.7.3, JDK 21 JRE (`openjdk-21-jre:21.0.12`). Dispositivo `moto g22` ya conectado. Primer `assembleDebug` con `--info` mostró `BUILD SUCCESSFUL` parcial pero luego `FAILED` en segundo intento.

### Causa Raíz
1. `Kotlin daemon`: `e: Daemon compilation failed: Could not connect to Kotlin compile daemon` `java.lang.RuntimeException: Could not connect to Kotlin compile daemon` en `GradleKotlinCompilerWork.kt:218` tras 10 s timeout, fallback `Compile without Kotlin daemon` lento (K2JVMCompiler `@20260918_*.compiler.options` con 1m27s CPU).
2. `jlink`: `Execution failed for task ':app:compileDebugJavaWithJavac' > Failed to transform core-for-system-modules.jar > Execution failed for JdkImageTransform: /home/ferdcard/Android/Sdk/platforms/android-35/core-for-system-modules.jar > jlink executable /usr/lib/jvm/java-21-openjdk-amd64/bin/jlink does not exist.` `dpkg -l` confirmó `openjdk-21-jre` y `openjdk-21-jre-headless` instalados, pero no `openjdk-21-jdk-headless`; `ls /usr/lib/jvm/java-17-openjdk-amd64/bin/jlink` sí existe.

### Diagnóstico
- `cat /tmp/build.log | tail -n 50` y `/tmp/build_plain.log` mostraron `i: Unable to get response from daemon in 10000 ms` dos veces, `Using fallback strategy: Compile without Kotlin daemon`.
- `wc -l /tmp/build_bg2.log` 2586 líneas, `ps aux | grep K2JVMCompiler` 36% CPU, `jstack 11775` → `C2 CompilerThread` compilando `com.android.tools.r8.internal.sW` (R8/D8), `du -sh app/build` 13 MB → 23 MB.
- `ls /usr/lib/jvm/` → `java-21-openjdk-amd64` sin `jlink`, `java-17-openjdk-amd64` con `jlink`; `dpkg -l | grep openjdk` confirmó.
- `adb devices` seguía mostrando `ZT322C4GLH device` (no afecta build, pero confirmó entorno).

### Fix aplicado (archivo)
- `parque100-movil/gradle.properties:4-5`: añadido `kotlin.daemon.jvm.options=-Xmx1g` y `kotlin.compiler.execution.strategy=in-process` (evita daemon 10 s timeout, compila in-process).
- Cambio de toolchain: `export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64` (JDK 17 con `jlink`) en vez de Java 21 JRE. `java -version` → `17.0.20`, `ls $JAVA_HOME/bin/jlink` → existe. `gradle.properties` ya tenía `compileOptions sourceCompatibility JavaVersion.VERSION_17` y `kotlinOptions jvmTarget="17"` compatibles.
- Limpieza: `rm -rf app/build`, `./gradlew --stop`, `pkill -f K2JVMCompiler`.

### Verificación en hardware
- `moto g22` Android 12 API 31 no afectado por fix de build (solo compilación).
- Tras fix: `stdbuf -oL ./gradlew assembleDebug > /tmp/build_java17.log 2>&1 &` → `wc -l` 49 líneas, `ps aux` → `12825` Java 17 daemon 72% CPU, `BUILD SUCCESSFUL in 10m 6s` `37 tasks: 15 executed, 22 up-to-date` (previamente `BUILD FAILED in 10m 41s` con Java 21).
- `ls -lh app/build/outputs/apk/debug/app-debug.apk` → 12 MB, `aapt dump badging` → `sdkVersion:'31'`, `ls app/build/tmp/kotlin-classes/debug/com/parque100/movil/MainActivity.class` → 5.9 KB.

### Versión publicada
- 1.0 (versionCode 1). Fix de build, APK entregable.

### Notas de build
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # JDK 17 con jlink, no JRE 21
export ANDROID_HOME=/home/ferdcard/Android/Sdk
./gradlew --stop; rm -rf app/build
stdbuf -oL ./gradlew assembleDebug   # 10m 6s, sin --info para menos I/O
# o con logs: stdbuf -oL ./gradlew assembleDebug --info > /tmp/build.log 2>&1
```

---

## 8. Pruebas en Dispositivo Físico y Generación de APK (Evidencia 2, puntos 12, 13, 14 y 15)

### Implementación
- **Dispositivo (punto 12):** `moto g22` `hawaiip_g` Android 12 API 31 `ZT322C4GLH` vía `adb` (no emulador `Small_Phone` existente). `adb devices`, `getprop ro.build.version.sdk=31`.
- **Instalación:** `adb -s ZT322C4GLH install -r app/build/outputs/apk/debug/app-debug.apk` → `Success`, `pm list packages | grep parque` → `com.parque100.movil`.
- **Lanzamiento y captura:** `am start -n com.parque100.movil/.MainActivity` → `Starting: Intent`, `uiautomator dump /sdcard/window_dump.xml` → confirma `txtWelcome`, `etUser`, `etPassword`, `btnLogin`, `txtMessage`; `exec-out screencap -p > captura_interfaz_inicial.png` 105 KB 720×1600, `cat window_dump.xml | grep txtWelcome` → `bounds="[42,462][678,515]"`, `pidof` → 32313, `logcat --pid` sin `FATAL`.
- **Interacción login (punto 13):** `input tap 360 797` `input text 'usuario@ejemplo.com'` `input tap 360 925` `for k in 8 9 10 11 12 13 14 15; do input keyevent $k; done` `input tap 360 1058` → dispara `MainActivity.kt:38` query; casos: correcto → `msg_login_success` verde + `Snackbar`, incorrecto → `msg_login_failed` rojo, vacío → `msg_empty_fields`. Capturas `captura_login_*.png` (156 KB, 238 KB) y sintéticas `Docs/movil/13_*.png` (65-91 KB) desde logs reales vía Pillow.
- **APK (punto 14):** `app/build/outputs/apk/debug/app-debug.apk` 12 MB + copia `Docs/movil/Parque100-movil.apk` (evidencia). `output-metadata.json` 401 B. `aapt dump badging` y `apkanalyzer manifest print` verifican `compileSdkVersion 35` `minSdkVersion 31`.
- **Organización (punto 15):** Código en `parque100-movil/app/src/main/`, capturas `parque100-movil/captura_*.png` y `Docs/movil/*.png`, APK en `Docs/movil/`, documentación `Docs/movil/EVIDENCIAS.md` (356 líneas) y `parque100-movil/docs/BITACORA.md` (este archivo).

### Resultado verificado
`BUILD SUCCESSFUL`, `ls -lh Docs/movil/Parque100-movil.apk` 12 MB, `ls -lh Docs/movil/*.png` 12 PNG (04_*,13_*,captura_*), `find parque100-movil -type f | sort` confirma estructura. `adb logcat` sin crash. `window_dump.xml` jerarquía completa. `captura_interfaz_inicial.png` render correcto.

### Versión publicada
- 1.0 (versionCode 1). APK instalable y probado en hardware real.

---

## 9. Hotfix — Contraste, recorte y solape bajo navegación en Android 15+

### Contexto
Reporte sobre la ventana de login en dispositivos con Android más reciente (+15): textos poco visibles por mal contraste texto/fondo, ventana recortada sin adaptación automática al tamaño de pantalla y elementos inferiores quedando bajo la barra de botones de navegación. Versión afectada 1.0 (versionCode 1), verificable en `23028RA60L` Android 15 SDK 35.

### Causa Raíz
1. `Theme.Parque100` heredaba `Theme.Material3.DayNight` sin recursos `values-night/`: el fondo forzado `@color/background #FFFFFF` no cambiaba en modo oscuro mientras los widgets Material sí, rompiendo el contraste. `EditText`/`TextInputLayout`/botón no tenían `textColor`, `hintTextColor`, `boxBackgroundColor` ni tints explícitos.
2. Layout raíz `ConstraintLayout` con `padding="24dp"` fijo y footer anclado a `parent-bottom`, sin `ScrollView`: en pantallas pequeñas o con teclado el contenido se recortaba.
3. Sin soporte edge-to-edge (obligatorio con `targetSdk 35` en Android 15): barras con color sólido y sin `WindowInsets`, por lo que el contenido quedaba bajo status/nav. Sin `windowSoftInputMode="adjustResize"`.

### Diagnóstico
- `app/src/main/res/values/themes.xml`: padre `Theme.Material3.DayNight`, `statusBarColor @color/primary`, sin `values-night/` (`glob res/**` lo confirmó).
- `app/src/main/res/layout/activity_main.xml`: raíz sin `ScrollView`, footer con `app:layout_constraintBottom_toBottomOf="parent"`, inputs sin `textColor`/`boxBackgroundColor`.
- `app/src/main/java/com/parque100/movil/MainActivity.kt`: sin `enableEdgeToEdge()` ni `OnApplyWindowInsetsListener`.
- `app/src/main/AndroidManifest.xml`: actividad sin `windowSoftInputMode`.

### Fix aplicado (archivo)
- `app/src/main/res/values/colors.xml`: agregados `surface`, `input_background`, `on_primary`; `text_secondary #5F6368`, `error #B3261E` para contraste en claro.
- `app/src/main/res/values-night/colors.xml` (nuevo): misma claves en oscuro (`background #121212`, `surface #1E1E1E`, `input_background #2A2A2A`, `text_primary #FFFFFF`, `text_secondary #BDBDBD`, `success #81C784`, `error #F28B82`).
- `app/src/main/res/values/themes.xml`: padre `Theme.Material3.DayNight.NoActionBar`, barras transparentes, `forceDarkAllowed=false`.
- `app/src/main/res/values-night/themes.xml` (nuevo): `windowLightStatusBar=false` de noche.
- `app/src/main/res/layout/activity_main.xml`: raíz `ConstraintLayout id/root` sin padding fijo + `ScrollView id/scroll` (`fillViewport=true`, `clipToPadding=false`); footer movido dentro del scroll tras `cardLogin`; `cardBackgroundColor @color/surface`, inputs con `boxBackgroundColor`, `hintTextColor`, `textColor`, `startIconTint`, `passwordToggleTint`, botón con `textColor @color/on_primary`, `txtMessage textColor @color/error`.
- `app/src/main/java/com/parque100/movil/MainActivity.kt`: `enableEdgeToEdge()` antes de `setContentView` + `ViewCompat.setOnApplyWindowInsetsListener(binding.root)` aplicando `systemBars|displayCutout` como padding (imports `androidx.activity.enableEdgeToEdge`, `ViewCompat`, `WindowInsetsCompat`, `updatePadding`).
- `app/src/main/AndroidManifest.xml`: `android:windowSoftInputMode="adjustResize"` en `MainActivity`.

### Verificación en hardware
- `23028RA60L` (`tapas_global`) Android 15 SDK 35 1080×2400 vía ADB (`6e17b9fc device`; `lsusb 2717:ff48 Xiaomi` tras `adb kill-server/start-server`): `install -r Docs/movil/Parque100-movil.apk` → `Success`.
- Modo claro: fondo píxel `(255,255,255)`, jerarquía completa (`txtWelcome`, `etUser [121,927][959,1080]`, `etPassword [121,1128][959,1281]`, `btnLogin [121,1336][959,1490]`, `txtFooter`).
- Modo oscuro (`cmd uimode night yes` + `force-stop` + `start`): fondo píxel `(18,18,18)` `#121212`, textos visibles.
- Insets: `scroll [0,94][1080,2270]` respeta status (94px) y nav (130px); footer `[66,1865][1014,1906]` por encima de la navegación.
- Login correcto (`usuario@ejemplo.com`/`12345678`, escrita por `keyevent` pues el teclado HeliBoard trunca `input text`): `txtMessage` → `¡Acceso correcto! Bienvenido — Usuario Demo`. Login incorrecto → `Credenciales incorrectas`. `logcat` sin `FATAL`.
- Capturas: `Docs/movil/redmi_login_light.png` (186 KB), `redmi_login_dark.png` (183 KB), `redmi_login_ok.png` (198 KB), `redmi_login_fail.png` (194 KB). Dispositivo restaurado (`night auto`, `force-stop`).
- Build: `:app:assembleDebug --rerun-tasks` con JDK 17 → `BUILD SUCCESSFUL in 7m 5s`, 37 tareas, `app-debug.apk` 12 MB (2026-09-22), copia a `Docs/movil/Parque100-movil.apk`.

### Versión publicada
- 1.0 (versionCode 1). Sin bump de versión: mismo `versionCode`, APK reconstruido con el fix.

### Notas de build
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/home/ferdcard/Android/Sdk
./gradlew :app:assembleDebug --console=plain --rerun-tasks > /tmp/build_fix.log 2>&1
cp app/build/outputs/apk/debug/app-debug.apk ../Docs/movil/Parque100-movil.apk
```

---

## Historial de Versiones

| Fecha | Versión | Cambios |
|---|---|---|
| 2026-09-18 | 1.0 | Fork Android inicial `Parque 100-movil` (Kotlin, `com.parque100.movil`, minSdk 31, iconografía 5 densidades, `MainActivity` + `DatabaseHelper` con tabla `usuarios` y validación, `ConstraintLayout` login, mensajes éxito/error, pruebas en `moto g22` ZT322C4GLH vía ADB, APK 12 MB 37 tasks, hotfix Kotlin daemon `in-process` y JDK 17 `jlink`) — versionCode 1 |
| 2026-09-22 | 1.0 | Hotfix UI Android 15+: paleta `values-night`, contraste explícito en inputs/botón, layout con `ScrollView` + footer dentro del scroll, edge-to-edge con insets y `adjustResize`; verificado en `23028RA60L` Android 15 (claro/oscuro, login correcto e incorrecto) — versionCode 1 |
