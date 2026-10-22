CREATE TABLE IF NOT EXISTS transacciones_pago_demo (
  ID_Transaccion bigint unsigned NOT NULL AUTO_INCREMENT,
  Clave_Idempotencia char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  Referencia varchar(45) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ID_Usuario int NOT NULL,
  ID_Pedido int DEFAULT NULL,
  Metodo varchar(30) NOT NULL,
  Estado varchar(20) NOT NULL,
  Monto int DEFAULT NULL,
  Fecha_Creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Fecha_Actualizacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID_Transaccion),
  UNIQUE KEY transacciones_pago_demo_idempotencia (ID_Usuario, Clave_Idempotencia),
  UNIQUE KEY transacciones_pago_demo_referencia (Referencia),
  UNIQUE KEY transacciones_pago_demo_pedido (ID_Pedido),
  KEY transacciones_pago_demo_vencimiento (ID_Usuario, Estado, Fecha_Creacion),
  CONSTRAINT transacciones_pago_demo_usuario_fk
    FOREIGN KEY (ID_Usuario) REFERENCES usuario (ID_Usuario) ON DELETE CASCADE,
  CONSTRAINT transacciones_pago_demo_pedido_fk
    FOREIGN KEY (ID_Pedido) REFERENCES pedidos (ID_Pedido) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
