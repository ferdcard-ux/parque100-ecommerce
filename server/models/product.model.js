/**
 * @fileoverview Modelo de productos.
 * Encapsula todas las consultas SQL sobre las tablas `productos`
 * y `categorias`. Es la unica capa que conoce la estructura de la
 * base de datos para esta entidad (patron MVC - Model).
 */
import pool from '../config/db.js';
import { DEMO_PAYMENT_METHODS } from '../config/payment-mode.js';

/**
 * Modelo de productos.
 * @namespace productModel
 */
export const productModel = {
  /**
   * Obtiene todos los productos junto con el nombre de su categoria y
   * el resumen de calificaciones (promedio y total de resenas).
   *
   * @async
   * @returns {Promise<Array<Object>>} Lista de productos con las columnas
   *   adicionales `Nombre_Categoria`, `Promedio_Calificacion` y
   *   `Total_Calificaciones`.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT p.*, c.Nombre_Categoria,
             r.promedio AS Promedio_Calificacion,
             r.total AS Total_Calificaciones
      FROM productos p
      LEFT JOIN categorias c ON p.ID_Categoria = c.ID_Categoria
      LEFT JOIN (
        SELECT ID_Producto, AVG(Estrellas) AS promedio, COUNT(*) AS total
        FROM calificaciones
        WHERE Tipo = 'producto' AND ID_Producto IS NOT NULL
        GROUP BY ID_Producto
      ) r ON r.ID_Producto = p.ID_Producto
    `);
    return rows;
  },

  /**
   * Obtiene el producto con mas unidades vendidas en los ultimos `days` dias.
   *
   * La ventana es movil (hoy menos `days`) y solo cuenta pedidos que no
   * estan cancelados ni usan un medio de pago DEMO. Se agrega por producto
   * para que el resultado sea el mas vendido real y no una linea de detalle.
   *
   * @async
   * @param {number} [days=7] - Tamano de la ventana en dias.
   * @returns {Promise<Object|null>} Producto con `Unidades_Vendidas` y
   *   `Pedidos`, o `null` si no hubo ventas en el periodo.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findTopSellingSince(days = 7) {
    const safeDays = Number.isInteger(days) && days > 0 && days <= 365 ? days : 7;
    const demoMethods = Object.values(DEMO_PAYMENT_METHODS);
    const demoFilter = demoMethods.length
      ? `AND (pd.Metodo_Pago IS NULL OR pd.Metodo_Pago NOT IN (${demoMethods.map(() => '?').join(', ')}))`
      : '';
    const [rows] = await pool.query(
      `SELECT p.*, c.Nombre_Categoria,
              r.promedio AS Promedio_Calificacion,
              r.total AS Total_Calificaciones,
              s.Unidades_Vendidas,
              s.Pedidos
       FROM (
         SELECT d.ID_Producto,
                SUM(COALESCE(d.Cantidad, 0)) AS Unidades_Vendidas,
                COUNT(DISTINCT pd.ID_Pedido) AS Pedidos,
                MAX(pd.Fecha) AS Ultima_Venta
         FROM detalle_pedido d
         JOIN pedidos pd ON pd.ID_Pedido = d.ID_Pedido
         WHERE pd.Fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
           AND COALESCE(pd.Estado, '') <> 'cancelado'
           ${demoFilter}
         GROUP BY d.ID_Producto
         ORDER BY Unidades_Vendidas DESC, Pedidos DESC, Ultima_Venta DESC, d.ID_Producto ASC
         LIMIT 1
       ) s
       JOIN productos p ON p.ID_Producto = s.ID_Producto
       LEFT JOIN categorias c ON p.ID_Categoria = c.ID_Categoria
       LEFT JOIN (
         SELECT ID_Producto, AVG(Estrellas) AS promedio, COUNT(*) AS total
         FROM calificaciones
         WHERE Tipo = 'producto' AND ID_Producto IS NOT NULL
         GROUP BY ID_Producto
       ) r ON r.ID_Producto = p.ID_Producto`,
      [safeDays, ...demoMethods],
    );
    return rows[0] || null;
  },

  /**
   * Busca un producto por su identificador.
   *
   * @async
   * @param {string} id - Identificador del producto (ej. 'P001').
   * @returns {Promise<Object|null>} El producto encontrado o `null` si no existe.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM productos WHERE ID_Producto = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Inserta un nuevo producto en la base de datos.
   *
   * @async
   * @param {Object} data - Datos del producto a crear.
   * @param {string} data.ID_Producto - Identificador unico del producto.
   * @param {string} data.Nombre - Nombre comercial del producto.
   * @param {string} data.Descripcion - Descripcion corta.
   * @param {string|null} data.Imagen - URL web o imagen local en dataURL (opcional).
   * @param {number} data.Precio_Venta - Precio de venta al publico.
   * @param {number} data.Stock_Minimo - Stock disponible/umbral minimo.
   * @param {number} data.ID_Categoria - Categoria asociada.
   * @returns {Promise<void>}
   * @throws {Error} Si falla la insercion (ej. categoria inexistente, ID duplicado).
   */
  async create({ ID_Producto, Nombre, Descripcion, Imagen, Precio_Venta, Precio_Anterior, Marca, Contenido_Cantidad, Contenido_Unidad, Embalaje, Ingredientes, Conservacion, Promo_Desde, Promo_Hasta, Stock_Minimo, ID_Categoria }) {
    await pool.query(
      'INSERT INTO productos (ID_Producto, Nombre, Descripcion, Imagen, Precio_Venta, Precio_Anterior, Marca, Contenido_Cantidad, Contenido_Unidad, Embalaje, Ingredientes, Conservacion, Promo_Desde, Promo_Hasta, Stock_Minimo, ID_Categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ID_Producto, Nombre, Descripcion, Imagen || null, Precio_Venta, Precio_Anterior ?? null, Marca ?? null, Contenido_Cantidad ?? null, Contenido_Unidad ?? null, Embalaje ?? null, Ingredientes ?? null, Conservacion ?? null, Promo_Desde ?? null, Promo_Hasta ?? null, Stock_Minimo, ID_Categoria],
    );
  },

  /**
   * Actualiza los datos de un producto existente.
   *
   * @async
   * @param {string} id - Identificador del producto a actualizar.
   * @param {Object} data - Campos a modificar (mismos nombres que en `create`).
   * @returns {Promise<void>}
   * @throws {Error} Si falla la actualizacion.
   */
  async update(id, data) {
    const allowed = ['Nombre', 'Descripcion', 'Imagen', 'Precio_Venta', 'Precio_Anterior', 'Marca', 'Contenido_Cantidad', 'Contenido_Unidad', 'Embalaje', 'Ingredientes', 'Conservacion', 'Promo_Desde', 'Promo_Hasta', 'Stock_Minimo', 'ID_Categoria'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (k in data) {
        sets.push(`${k}=?`);
        vals.push(data[k] ?? null);
      }
    }
    if (sets.length === 0) return;
    vals.push(id);
    await pool.query(`UPDATE productos SET ${sets.join(', ')} WHERE ID_Producto=?`, vals);
  },

  /**
   * Elimina un producto por su identificador.
   *
   * @async
   * @param {string} id - Identificador del producto.
   * @returns {Promise<void>}
   * @throws {Error} Si el producto esta referenciado por detalles de pedido
   *   (restriccion de llave foranea) o falla la eliminacion.
   */
  async remove(id) {
    await pool.query('DELETE FROM productos WHERE ID_Producto = ?', [id]);
  },
};

export default productModel;
