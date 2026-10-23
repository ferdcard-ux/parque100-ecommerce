/**
 * @fileoverview Credenciales de administracion de MySQL para tareas que
 * alteran el esquema o los usuarios (migraciones, restauracion del dump,
 * aprovisionamiento del acceso, limpieza de pruebas).
 *
 * El backend usa una cuenta con privilegios minimos (`DB_USER` del `.env`).
 * Las tareas administrativas usan `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` si se
 * definen en el entorno de la terminal; nunca se guardan en `.env`.
 *
 *   PowerShell: $env:DB_ADMIN_USER='root'; $env:DB_ADMIN_PASSWORD='...'
 *
 * Importar despues de `load-env.js` y antes de abrir conexiones.
 */
if (process.env.DB_ADMIN_USER) {
  process.env.DB_USER = process.env.DB_ADMIN_USER;
  process.env.DB_PASSWORD = process.env.DB_ADMIN_PASSWORD ?? '';
  // Los clientes `mysql`/`mysqldump` leen la contrasena de MYSQL_PWD.
  if (process.env.DB_ADMIN_PASSWORD) process.env.MYSQL_PWD = process.env.DB_ADMIN_PASSWORD;
}
