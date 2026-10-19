/**
 * @fileoverview Controlador de productos.
 * Contiene la logica de negocio del modulo principal (catalogo de
 * productos) y traduce entre las peticiones HTTP y el modelo
 * `productModel` (patron MVC - Controller).
 */
import productModel from '../models/product.model.js';

/**
 * Valida y sanea los campos editables de un producto.
 *
 * @param {Object} body - Cuerpo de la peticion.
 * @param {boolean} requireId - true en el alta (el ID lo define el admin).
 * @returns {Object|null} Datos saneados o null si son invalidos.
 */
function validateProduct(body, requireId) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const str = (value, max, allowEmpty = true) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || value.length > max) return undefined;
    if (!allowEmpty && value.trim().length === 0) return undefined;
    return value;
  };
  const out = {};
  if (requireId) {
    if (typeof body.ID_Producto !== 'string' || body.ID_Producto.trim().length === 0 || body.ID_Producto.length > 30) {
      return null;
    }
    out.ID_Producto = body.ID_Producto.trim();
  }
  const nombre = str(body.Nombre, 50, false);
  if (nombre === undefined || nombre === null) return null;
  out.Nombre = nombre.trim();
  const descripcion = str(body.Descripcion, 255);
  if (descripcion === undefined) return null;
  out.Descripcion = descripcion ?? out.Nombre;
  const precio = Number(body.Precio_Venta);
  if (!Number.isFinite(precio) || precio < 0) return null;
  out.Precio_Venta = precio;
  if (body.Precio_Anterior !== undefined && body.Precio_Anterior !== null && body.Precio_Anterior !== '') {
    const prev = Number(body.Precio_Anterior);
    if (!Number.isFinite(prev) || prev < 0) return null;
    out.Precio_Anterior = prev;
  } else {
    out.Precio_Anterior = null;
  }
  if (!Number.isInteger(Number(body.Stock_Minimo)) || Number(body.Stock_Minimo) < 0) return null;
  out.Stock_Minimo = Number(body.Stock_Minimo);
  if (!Number.isInteger(Number(body.ID_Categoria)) || Number(body.ID_Categoria) <= 0) return null;
  out.ID_Categoria = Number(body.ID_Categoria);
  /**
   * Imagen opcional. En una actualizacion, si el campo no viene en el
   * cuerpo se omite para conservar la imagen actual; enviar cadena
   * vacia la elimina.
   */
  if (body.Imagen !== undefined) {
    const imagen = str(body.Imagen, 7000000);
    if (imagen === undefined) return null;
    if (imagen && !imagen.startsWith('data:image/') && !/^https?:\/\//.test(imagen)) return null;
    out.Imagen = imagen;
  }
  for (const field of ['Marca', 'Contenido_Unidad', 'Embalaje', 'Ingredientes', 'Conservacion', 'Promo_Desde', 'Promo_Hasta']) {
    const value = str(body[field], 255);
    if (value === undefined) return null;
    out[field] = value;
  }
  if (body.Contenido_Cantidad !== undefined && body.Contenido_Cantidad !== null && body.Contenido_Cantidad !== '') {
    const qty = Number(body.Contenido_Cantidad);
    if (!Number.isFinite(qty) || qty < 0) return null;
    out.Contenido_Cantidad = qty;
  } else {
    out.Contenido_Cantidad = null;
  }
  return out;
}

/**
 * Controlador de productos.
 * @namespace productController
 */
export const productController = {
  /**
   * GET /api/products
   * Responde con la lista completa de productos.
   *
   * @async
   * @param {import('express').Request} _req - Peticion (sin parametros).
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async list(_req, res) {
    try {
      const products = await productModel.findAll();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /api/products/:id
   * Responde con un producto especifico o 404 si no existe.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `req.params.id`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async getById(req, res) {
    try {
      const product = await productModel.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * POST /api/products
   * Crea un producto a partir del cuerpo JSON de la peticion.
   *
   * @async
   * @param {import('express').Request} req - Cuerpo con los datos del producto.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>} 201 con mensaje de exito o 500 ante error.
   */
  async create(req, res) {
    const data = validateProduct(req.body, true);
    if (!data) return res.status(400).json({ error: 'Datos de producto invalidos' });
    try {
      await productModel.create(data);
      res.status(201).json({ message: 'Producto creado' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe un producto con ese identificador' });
      }
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ error: 'La categoria no existe' });
      }
      res.status(500).json({ error: 'Error al crear el producto' });
    }
  },

  /**
   * PUT /api/products/:id
   * Actualiza un producto existente con los campos del cuerpo JSON.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `params.id` y cuerpo.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async update(req, res) {
    const data = validateProduct(req.body, false);
    if (!data) return res.status(400).json({ error: 'Datos de producto invalidos' });
    try {
      const existing = await productModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
      await productModel.update(req.params.id, data);
      res.json({ message: 'Producto actualizado' });
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ error: 'La categoria no existe' });
      }
      res.status(500).json({ error: 'Error al actualizar el producto' });
    }
  },

  /**
   * DELETE /api/products/:id
   * Elimina un producto por su identificador.
   *
   * @async
   * @param {import('express').Request} req - Peticion con `req.params.id`.
   * @param {import('express').Response} res - Respuesta HTTP.
   * @returns {Promise<void>}
   */
  async remove(req, res) {
    try {
      const existing = await productModel.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
      await productModel.remove(req.params.id);
      res.json({ message: 'Producto eliminado' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'No se puede eliminar: el producto tiene pedidos asociados' });
      }
      res.status(500).json({ error: 'Error al eliminar el producto' });
    }
  },
};

export default productController;
