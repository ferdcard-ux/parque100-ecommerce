/**
 * @fileoverview Modelo de productos.
 * Encapsula todas las consultas SQL sobre las tablas `productos`
 * y `categorias`. Es la unica capa que conoce la estructura de la
 * base de datos para esta entidad (patron MVC - Model).
 */
import pool from '../config/db.js';

/**
 * Modelo de productos.
 * @namespace productModel
 */
export const productModel = {
  /**
   * Obtiene todos los productos junto con el nombre de su categoria.
   *
   * @async
   * @returns {Promise<Array<Object>>} Lista de productos con la columna
   *   adicional `Nombre_Categoria` (puede ser null si no tiene categoria).
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findAll() {
    const [rows] = await pool.query(`
      SELECT p.*, c.Nombre_Categoria
      FROM productos p
      LEFT JOIN categorias c ON p.ID_Categoria = c.ID_Categoria
    `);
    return rows;
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
   * @param {string|null} data.Imagen - URL de imagen (opcional).
   * @param {number} data.Precio_Venta - Precio de venta al publico.
   * @param {number} data.Stock_Minimo - Stock disponible/umbral minimo.
   * @param {number} data.ID_Categoria - Categoria asociada.
   * @returns {Promise<void>}
   * @throws {Error} Si falla la insercion (ej. categoria inexistente, ID duplicado).
   */
  async create({ ID_Producto, Nombre, Descripcion, Imagen, Precio_Venta, Stock_Minimo, ID_Categoria }) {
    await pool.query(
      'INSERT INTO productos (ID_Producto, Nombre, Descripcion, Imagen, Precio_Venta, Stock_Minimo, ID_Categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ID_Producto, Nombre, Descripcion, Imagen || null, Precio_Venta, Stock_Minimo, ID_Categoria],
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
  async update(id, { Nombre, Descripcion, Imagen, Precio_Venta, Stock_Minimo, ID_Categoria }) {
    await pool.query(
      'UPDATE productos SET Nombre=?, Descripcion=?, Imagen=?, Precio_Venta=?, Stock_Minimo=?, ID_Categoria=? WHERE ID_Producto=?',
      [Nombre, Descripcion, Imagen || null, Precio_Venta, Stock_Minimo, ID_Categoria, id],
    );
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
