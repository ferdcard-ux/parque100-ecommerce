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
