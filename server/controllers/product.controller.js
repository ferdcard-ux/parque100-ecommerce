/**
 * @fileoverview Controlador de productos.
 * Contiene la logica de negocio del modulo principal (catalogo de
 * productos) y traduce entre las peticiones HTTP y el modelo
 * `productModel` (patron MVC - Controller).
 */
import productModel from '../models/product.model.js';

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
    try {
      await productModel.create(req.body);
      res.status(201).json({ message: 'Producto creado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
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
    try {
      await productModel.update(req.params.id, req.body);
      res.json({ message: 'Producto actualizado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
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
      await productModel.remove(req.params.id);
      res.json({ message: 'Producto eliminado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default productController;
