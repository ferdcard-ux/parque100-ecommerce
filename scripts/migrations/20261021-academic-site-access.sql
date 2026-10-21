-- Run once against the parque100 database before enabling the protected site.
-- This migration creates no users and authorizes nobody.
USE parque100;

CREATE TABLE IF NOT EXISTS sitio_usuarios_autorizados (
  ID_Usuario int(11) NOT NULL,
  Autorizado_En timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ID_Usuario),
  CONSTRAINT sitio_usuarios_autorizados_ibfk_1
    FOREIGN KEY (ID_Usuario) REFERENCES usuario (ID_Usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS sitio_aceptaciones_descargo (
  ID_Aceptacion bigint NOT NULL AUTO_INCREMENT,
  ID_Usuario int(11) NOT NULL,
  Session_ID char(36) NOT NULL,
  Version varchar(40) NOT NULL,
  Aceptado_En timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ID_Aceptacion),
  UNIQUE KEY sitio_aceptaciones_descargo_session_version (Session_ID, Version),
  KEY sitio_aceptaciones_descargo_user (ID_Usuario),
  CONSTRAINT sitio_aceptaciones_descargo_ibfk_1
    FOREIGN KEY (ID_Usuario) REFERENCES usuario (ID_Usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Authorize each approved account explicitly after verifying its identity:
-- INSERT INTO sitio_usuarios_autorizados (ID_Usuario)
-- SELECT ID_Usuario FROM usuario WHERE Correo = 'approved-account@example.invalid';
--
-- To revoke access:
-- DELETE FROM sitio_usuarios_autorizados WHERE ID_Usuario = <approved-user-id>;
