import { Router } from 'express';
import pool from '../../connection.js';

const router = Router();

router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.Nombre AS Usuario_Nombre
      FROM pedidos p
      LEFT JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
      ORDER BY p.Fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pedidos WHERE ID_Pedido = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const [details] = await pool.query(`
      SELECT d.*, p.Nombre AS Producto_Nombre
      FROM detalle_pedido d
      LEFT JOIN productos p ON d.ID_Producto = p.ID_Producto
      WHERE d.ID_Pedido = ?
    `, [req.params.id]);

    res.json({ ...rows[0], detalles: details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { Fecha, Estado, Total, Tipo_Entrega, ID_Usuario, productos } = req.body;
    const [result] = await pool.query(
      'INSERT INTO pedidos (Fecha, Estado, Total, Tipo_Entrega, ID_Usuario) VALUES (?, ?, ?, ?, ?)',
      [Fecha || new Date().toISOString().split('T')[0], Estado || 'pendiente', Total, Tipo_Entrega, ID_Usuario]
    );
    const pedidoId = result.insertId;

    if (productos && productos.length > 0) {
      for (const item of productos) {
        await pool.query(
          'INSERT INTO detalle_pedido (ID_Pedido, ID_Producto, Cantidad, Subtotal) VALUES (?, ?, ?, ?)',
          [pedidoId, item.ID_Producto, item.Cantidad, item.Subtotal]
        );
      }
    }
    res.status(201).json({ id: pedidoId, message: 'Pedido creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
