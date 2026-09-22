package com.parque100.movil.db

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Helper SQLite para la tabla de usuarios.
 * Evidencia 2 - Requisitos 9 y 10:
 *  - Crear base de datos / tabla usuarios en SQLite.
 *  - Programar consulta para validar credenciales.
 *
 * Tabla: usuarios
 *   id INTEGER PRIMARY KEY AUTOINCREMENT
 *   email TEXT UNIQUE NOT NULL
 *   password TEXT NOT NULL
 *   nombre TEXT
 *   rol TEXT (usuario | admin)
 */
class DatabaseHelper(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "parque100.db"
        const val DATABASE_VERSION = 1
        const val TABLE_USUARIOS = "usuarios"
        const val COL_ID = "id"
        const val COL_EMAIL = "email"
        const val COL_PASSWORD = "password"
        const val COL_NOMBRE = "nombre"
        const val COL_ROL = "rol"
    }

    override fun onCreate(db: SQLiteDatabase) {
        // Estructura: Manifest (config), Res (recursos), Java/Kotlin (lógica), Gradle (build) -> se verifica en documentación
        val createTable = """
            CREATE TABLE $TABLE_USUARIOS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_EMAIL TEXT UNIQUE NOT NULL,
                $COL_PASSWORD TEXT NOT NULL,
                $COL_NOMBRE TEXT,
                $COL_ROL TEXT DEFAULT 'usuario'
            );
        """.trimIndent()
        db.execSQL(createTable)

        // Datos de prueba alineados con el proyecto web (README.md):
        // usuario@ejemplo.com / 12345678  y  admin@parque100.com / admin123
        insertUser(db, "usuario@ejemplo.com", "12345678", "Usuario Demo", "usuario")
        insertUser(db, "admin@parque100.com", "admin123", "Administrador", "admin")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_USUARIOS")
        onCreate(db)
    }

    private fun insertUser(
        db: SQLiteDatabase,
        email: String,
        password: String,
        nombre: String,
        rol: String
    ) {
        val values = ContentValues().apply {
            put(COL_EMAIL, email)
            put(COL_PASSWORD, password)
            put(COL_NOMBRE, nombre)
            put(COL_ROL, rol)
        }
        db.insert(TABLE_USUARIOS, null, values)
    }

    /**
     * Valida credenciales ingresadas.
     * Retorna true si existe coincidencia exacta email + password.
     * Requisito 10: consulta para validar credenciales.
     */
    fun validarCredenciales(email: String, password: String): Boolean {
        val db = readableDatabase
        // Uso de parámetros (?) para prevenir inyección SQL
        val cursor = db.rawQuery(
            "SELECT $COL_ID FROM $TABLE_USUARIOS WHERE $COL_EMAIL = ? AND $COL_PASSWORD = ? LIMIT 1",
            arrayOf(email.trim(), password)
        )
        val existe = cursor.count > 0
        cursor.close()
        return existe
    }

    /**
     * Obtiene nombre del usuario por email, útil para mensaje personalizado.
     */
    fun obtenerNombre(email: String): String? {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT $COL_NOMBRE FROM $TABLE_USUARIOS WHERE $COL_EMAIL = ? LIMIT 1",
            arrayOf(email.trim())
        )
        var nombre: String? = null
        if (cursor.moveToFirst()) {
            nombre = cursor.getString(0)
        }
        cursor.close()
        return nombre
    }
}
