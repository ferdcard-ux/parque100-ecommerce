-- Multi-device sessions for the isolated academic access database.
-- One row per login/device. The JWT `jti` is the primary key.
USE parque100_acceso;

CREATE TABLE IF NOT EXISTS sesiones_acceso (
  ID_Sesion char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ID_Acceso bigint unsigned NOT NULL,
  Creada_En timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  Ultima_Actividad timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  Revocada_En timestamp(3) NULL DEFAULT NULL,
  User_Agent varchar(255) NULL DEFAULT NULL,
  Direccion_IP varchar(45) NULL DEFAULT NULL,
  PRIMARY KEY (ID_Sesion),
  KEY sesiones_acceso_usuario (ID_Acceso, Revocada_En),
  KEY sesiones_acceso_actividad (Ultima_Actividad),
  CONSTRAINT sesiones_acceso_usuario_fk
    FOREIGN KEY (ID_Acceso) REFERENCES usuarios_acceso (ID_Acceso)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Preserve the session that was active before this migration. New logins
-- insert additional rows instead of replacing the previous one.
INSERT INTO sesiones_acceso
  (ID_Sesion, ID_Acceso, Creada_En, Ultima_Actividad)
SELECT Sesion_ID, ID_Acceso,
       COALESCE(Sesion_Iniciada_En, CURRENT_TIMESTAMP(3)),
       COALESCE(Ultima_Actividad, Sesion_Iniciada_En, CURRENT_TIMESTAMP(3))
FROM usuarios_acceso
WHERE Sesion_ID IS NOT NULL
  AND (Sesion_Revocada_En IS NULL OR Sesion_Revocada_En < Sesion_Iniciada_En)
ON DUPLICATE KEY UPDATE
  ID_Acceso = VALUES(ID_Acceso),
  Ultima_Actividad = GREATEST(
    sesiones_acceso.Ultima_Actividad, VALUES(Ultima_Actividad));
