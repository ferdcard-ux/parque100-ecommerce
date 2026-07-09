import { Router } from 'express';
import pool from '../../connection.js';

const router = Router();

router.post('/auth/login', async (req, res) => {
  try {
    const { Correo, Contrasena } = req.body;
    const [rows] = await pool.query('SELECT * FROM usuario WHERE Correo = ? AND Contrasena = ?', [Correo, Contrasena]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales invalidas' });
    const user = rows[0];
    res.json({
      id: user.ID_Usuario,
      nombre: user.Nombre,
      correo: user.Correo,
      rol: user.Rol,
      telefono: user.Telefono,
      direccion: user.Direccion
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { Nombre, Correo, Contrasena, Telefono, Direccion } = req.body;
    const [result] = await pool.query(
      'INSERT INTO usuario (Nombre, Correo, Contrasena, Rol, Telefono, Direccion) VALUES (?, ?, ?, ?, ?, ?)',
      [Nombre, Correo, Contrasena, 'usuario', Telefono || null, Direccion]
    );
    res.status(201).json({ id: result.insertId, message: 'Usuario registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
