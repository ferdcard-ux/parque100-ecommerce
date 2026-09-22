package com.parque100.movil

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.google.android.material.snackbar.Snackbar
import com.parque100.movil.databinding.ActivityMainBinding
import com.parque100.movil.db.DatabaseHelper

/**
 * Actividad principal — fork móvil de Tienda Parque 100.
 *
 * Evidencia 1:
 *  - Proyecto: Parque 100-movil, paquete com.parque100.movil, minSdk 31 (Android 12), Kotlin.
 *  - Actividad principal configurada (AndroidManifest + MainActivity) y mensaje visible (txtWelcome).
 *
 * Evidencia 2:
 *  - Layout ConstraintLayout (activity_main.xml)
 *  - Campos usuario/contraseña + botón login
 *  - Base de datos SQLite (DatabaseHelper) con tabla usuarios
 *  - Consulta validarCredenciales(email, password)
 *  - Mensajes de acceso correcto / credenciales incorrectas
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var dbHelper: DatabaseHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Android 15 impone edge-to-edge: dibujar tras las barras y aplicar
        // los insets como padding para que nada quede bajo status/nav.
        enableEdgeToEdge()
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                        or WindowInsetsCompat.Type.displayCutout()
            )
            v.updatePadding(
                left = bars.left,
                top = bars.top,
                right = bars.right,
                bottom = bars.bottom
            )
            insets
        }

        dbHelper = DatabaseHelper(this)

        // El mensaje visible ya está en el layout (txtWelcome: "Bienvenido a Parque 100-movil")
        // Se podría dinamizar si se requiere: binding.txtWelcome.text = getString(R.string.welcome_message)

        binding.btnLogin.setOnClickListener {
            val email = binding.etUser.text?.toString()?.trim().orEmpty()
            val password = binding.etPassword.text?.toString().orEmpty()

            if (email.isEmpty() || password.isEmpty()) {
                mostrarMensaje(getString(R.string.msg_empty_fields), esExito = false)
                return@setOnClickListener
            }

            // Programar consulta para validar credenciales (Requisito 10)
            val valido = dbHelper.validarCredenciales(email, password)

            if (valido) {
                val nombre = dbHelper.obtenerNombre(email) ?: email
                // Mensaje acceso correcto (Requisito 11)
                mostrarMensaje("${getString(R.string.msg_login_success)} — $nombre", esExito = true)
                // Feedback adicional con Toast/Snackbar
                Snackbar.make(binding.root, "Sesión iniciada como $nombre", Snackbar.LENGTH_LONG).show()
            } else {
                // Mensaje credenciales incorrectas (Requisito 11)
                mostrarMensaje(getString(R.string.msg_login_failed), esExito = false)
            }
        }
    }

    private fun mostrarMensaje(mensaje: String, esExito: Boolean) {
        binding.txtMessage.apply {
            text = mensaje
            visibility = View.VISIBLE
            setTextColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (esExito) R.color.success else R.color.error
                )
            )
        }
        // También Toast para prueba en emulador/dispositivo físico (Requisito 12)
        Toast.makeText(this, mensaje, Toast.LENGTH_SHORT).show()
    }
}
