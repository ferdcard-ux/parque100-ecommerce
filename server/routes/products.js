import { Router } from 'express';
import pool from '../../connection.js';

const router = Router();

router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.Nombre_Categoria
      FROM productos p
      LEFT JOIN categorias c ON p.ID_Categoria = c.ID_Categoria
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE ID_Producto = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { ID_Producto, Nombre, Descripcion, Precio_Venta, Stock_Minimo, ID_Categoria, Imagen } = req.body;
    await pool.query(
      'INSERT INTO productos (ID_Producto, Nombre, Descripcion, Imagen, Precio_Venta, Stock_Minimo, ID_Categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ID_Producto, Nombre, Descripcion, Imagen || null, Precio_Venta, Stock_Minimo, ID_Categoria]
    );
    res.status(201).json({ message: 'Producto creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { Nombre, Descripcion, Precio_Venta, Stock_Minimo, ID_Categoria, Imagen } = req.body;
    await pool.query(
      'UPDATE productos SET Nombre=?, Descripcion=?, Imagen=?, Precio_Venta=?, Stock_Minimo=?, ID_Categoria=? WHERE ID_Producto=?',
      [Nombre, Descripcion, Imagen || null, Precio_Venta, Stock_Minimo, ID_Categoria, req.params.id]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM productos WHERE ID_Producto = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
