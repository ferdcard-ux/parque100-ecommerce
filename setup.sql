-- ============================================
-- SETUP COMPLETO - Parque 100
-- Crea BD, tablas y datos de prueba
-- ============================================

CREATE DATABASE IF NOT EXISTS parque100 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE parque100;

-- --------------------------------------------------------
-- CATEGORIAS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  ID_Categoria int(255) NOT NULL AUTO_INCREMENT,
  Nombre_Categoria varchar(30) NOT NULL,
  Descripcion varchar(30) DEFAULT NULL,
  PRIMARY KEY (ID_Categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- PRODUCTOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  ID_Producto varchar(30) NOT NULL,
  Nombre varchar(50) DEFAULT NULL,
  Descripcion varchar(255) DEFAULT NULL,
  Precio_Venta int(20) DEFAULT NULL,
  Stock_Minimo int(30) DEFAULT NULL,
  ID_Categoria int(11) DEFAULT NULL,
  PRIMARY KEY (ID_Producto),
  KEY ID_Categoria (ID_Categoria),
  CONSTRAINT productos_ibfk_1 FOREIGN KEY (ID_Categoria) REFERENCES categorias (ID_Categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- USUARIO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  ID_Usuario int(11) NOT NULL AUTO_INCREMENT,
  Nombre varchar(30) NOT NULL,
  Correo varchar(50) NOT NULL,
  Contrasena varchar(30) NOT NULL,
  Rol varchar(20) DEFAULT NULL,
  Telefono int(20) DEFAULT NULL,
  Direccion varchar(20) NOT NULL,
  PRIMARY KEY (ID_Usuario),
  UNIQUE KEY Correo (Correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- PEDIDOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  ID_Pedido int(255) NOT NULL AUTO_INCREMENT,
  Fecha date DEFAULT NULL,
  Estado varchar(20) DEFAULT NULL,
  Total int(20) DEFAULT NULL,
  Tipo_Entrega varchar(20) DEFAULT NULL,
  ID_Usuario int(255) DEFAULT NULL,
  PRIMARY KEY (ID_Pedido),
  KEY ID_Usuario (ID_Usuario),
  CONSTRAINT pedidos_ibfk_1 FOREIGN KEY (ID_Usuario) REFERENCES usuario (ID_Usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- DETALLE PEDIDO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  ID_Detalle int(255) NOT NULL AUTO_INCREMENT,
  ID_Pedido int(255) DEFAULT NULL,
  ID_Producto varchar(30) DEFAULT NULL,
  Cantidad int(20) DEFAULT NULL,
  Subtotal int(30) DEFAULT NULL,
  PRIMARY KEY (ID_Detalle),
  KEY ID_Pedido (ID_Pedido),
  KEY ID_Producto (ID_Producto),
  CONSTRAINT detalle_pedido_ibfk_1 FOREIGN KEY (ID_Pedido) REFERENCES pedidos (ID_Pedido),
  CONSTRAINT detalle_pedido_ibfk_2 FOREIGN KEY (ID_Producto) REFERENCES productos (ID_Producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- DATOS DE PRUEBA
-- --------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE detalle_pedido;
TRUNCATE pedidos;
TRUNCATE productos;
TRUNCATE usuario;
TRUNCATE categorias;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO categorias (ID_Categoria, Nombre_Categoria, Descripcion) VALUES
(1, 'Verduras', 'Verduras frescas'),
(2, 'Frutas', 'Frutas de temporada'),
(3, 'Carnes', 'Carnes frias'),
(4, 'Granos', 'Granos y cereales'),
(5, 'Lacteos', 'Lacteos y derivados'),
(6, 'Panaderia', 'Pan y reposteria'),
(7, 'Bebidas', 'Bebidas naturales'),
(8, 'Limpieza', 'Productos de limpieza');

INSERT INTO productos (ID_Producto, Nombre, Descripcion, Precio_Venta, Stock_Minimo, ID_Categoria) VALUES
('P001', 'Tomates Cherry 500g', 'Tomates cherry frescos y jugosos', 3500, 45, 1),
('P002', 'Bananos x6 und', 'Bananos maduros de la mejor calidad', 2800, 32, 2),
('P003', 'Fresas Frescas 500g', 'Fresas frescas de temporada', 4200, 8, 2),
('P004', 'Canasta de Frutas', 'Canasta con variedad de frutas', 12000, 10, 2),
('P005', 'Verduras Mixtas 1kg', 'Seleccion de verduras del dia', 6500, 3, 1),
('P006', 'Manzanas Rojas x5', 'Manzanas rojas importadas', 4800, 25, 2),
('P007', 'Surtido Verduras', 'Verduras variadas conservadas', 7200, 15, 1),
('P008', 'Mix Frutas Tropicales', 'Frutas tropicales frescas', 5500, 20, 2),
('P009', 'Leche Entera 1L', 'Leche entera pasteurizada', 3200, 5, 5),
('P010', 'Pan Tajado 500g', 'Pan de molde blanco', 4500, 18, 6);

INSERT INTO usuario (ID_Usuario, Nombre, Correo, Contrasena, Rol, Telefono, Direccion) VALUES
(1, 'Usuario Demo', 'usuario@ejemplo.com', '12345678', 'usuario', 300123456, 'Calle 123 #45-67'),
(2, 'Admin Parque100', 'admin@parque100.com', 'admin123', 'admin', 300987654, 'Cra 98 #76-54');
