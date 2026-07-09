import { Router } from 'express';
import pool from '../../connection.js';

const router = Router();

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY ID_Categoria');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
