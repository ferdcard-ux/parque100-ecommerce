-- Isolated identity store for website access; never add these tables to
-- setup.sql or the shared parque100 demo database.
CREATE DATABASE IF NOT EXISTS parque100_acceso
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE parque100_acceso;

CREATE TABLE IF NOT EXISTS usuarios_acceso (
  ID_Acceso bigint unsigned NOT NULL AUTO_INCREMENT,
  Usuario varchar(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  Hash_Contrasena varchar(60) NOT NULL,
  Activo tinyint(1) NOT NULL DEFAULT 1,
  Creado_En timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Ultimo_Acceso timestamp NULL DEFAULT NULL,
  Sesion_ID char(36) CHARACTER SET ascii COLLATE ascii_bin NULL DEFAULT NULL,
  Sesion_Iniciada_En timestamp(3) NULL DEFAULT NULL,
  Ultima_Actividad timestamp(3) NULL DEFAULT NULL,
  Sesion_Revocada_En timestamp(3) NULL DEFAULT NULL,
  Intentos_Fallidos int unsigned NOT NULL DEFAULT 0,
  Ultimo_Intento_Fallido timestamp(3) NULL DEFAULT NULL,
  Bloqueado_Hasta timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (ID_Acceso),
  UNIQUE KEY usuarios_acceso_usuario (Usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS aceptaciones_descargo (
  ID_Aceptacion bigint unsigned NOT NULL AUTO_INCREMENT,
  ID_Acceso bigint unsigned NOT NULL,
  Session_ID char(36) NOT NULL,
  Version varchar(40) NOT NULL,
  Aceptado_En timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ID_Aceptacion),
  UNIQUE KEY aceptaciones_descargo_session_version (Session_ID, Version),
  KEY aceptaciones_descargo_usuario (ID_Acceso),
  CONSTRAINT aceptaciones_descargo_usuario_fk
    FOREIGN KEY (ID_Acceso) REFERENCES usuarios_acceso (ID_Acceso) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
