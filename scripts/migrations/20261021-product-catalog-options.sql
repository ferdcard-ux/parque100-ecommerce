CREATE TABLE IF NOT EXISTS unidades_medida (
  ID_Unidad int NOT NULL AUTO_INCREMENT,
  Nombre_Unidad varchar(30) NOT NULL,
  PRIMARY KEY (ID_Unidad),
  UNIQUE KEY unidades_medida_nombre (Nombre_Unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
