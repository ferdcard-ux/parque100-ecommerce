/**
 * @fileoverview Modelo de usuarios.
 * Encapsula las consultas SQL sobre la tabla `usuario`.
 * Unica capa que conoce la estructura de esta entidad (patron MVC - Model).
 */
import pool from '../config/db.js';

/**
 * Modelo de usuarios.
 * @namespace userModel
 */
export const userModel = {
  /**
   * Busca un usuario por correo y contrasena (credenciales de login).
   *
   * NOTA: en un entorno de produccion real deberia usarse un hash
   * (bcrypt) comparado en aplicacion, nunca texto plano en el WHERE.
   *
   * @async
   * @param {string} correo - Correo electronico del usuario.
   * @param {string} contrasena - Contrasena en texto plano.
   * @returns {Promise<Object|null>} Fila del usuario o `null` si las
   *   credenciales no coinciden.
   * @throws {Error} Si falla la consulta a la base de datos.
   */
  async findByCredentials(correo, contrasena) {
    const [rows] = await pool.query('SELECT * FROM usuario WHERE Correo = ? AND Contrasena = ?', [
      correo,
      contrasena,
    ]);
    return rows[0] || null;
  },

  /**
   * Registra un nuevo usuario con rol 'usuario'.
   *
   * @async
   * @param {Object} data - Datos del nuevo usuario.
   * @param {string} data.Nombre - Nombre completo.
   * @param {string} data.Correo - Correo electronico (unico).
   * @param {string} data.Contrasena - Contrasena.
   * @param {string|null} data.Telefono - Telefono de contacto (opcional).
   * @param {string} data.Direccion - Direccion de entrega.
   * @returns {Promise<number>} El `insertId` generado para el nuevo usuario.
   * @throws {Error} Si el correo ya existe o falla la insercion.
   */
  async create({ Nombre, Correo, Contrasena, Telefono, Direccion }) {
    const [result] = await pool.query(
      'INSERT INTO usuario (Nombre, Correo, Contrasena, Rol, Telefono, Direccion) VALUES (?, ?, ?, ?, ?, ?)',
      [Nombre, Correo, Contrasena, 'usuario', Telefono || null, Direccion],
    );
    return result.insertId;
  },

  /**
   * Obtiene los datos de entrega de un usuario.
   *
   * @param {number} id - Identificador del usuario.
   * @returns {Promise<Object|null>} Datos de entrega o null si no existe.
   */
  async findDeliveryDetailsById(id) {
    const [rows] = await pool.query(
      'SELECT Telefono, Torre_Bloque, Piso, Apartamento FROM usuario WHERE ID_Usuario = ?',
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Actualiza unicamente los datos persistentes de entrega.
   *
   * @param {number} id - Identificador del usuario.
   * @param {Object} details - Datos de entrega validados.
   * @returns {Promise<void>}
   */
  async updateDeliveryDetailsById(id, { Telefono, Torre_Bloque, Piso, Apartamento }) {
    await pool.query(
      'UPDATE usuario SET Telefono = ?, Torre_Bloque = ?, Piso = ?, Apartamento = ? WHERE ID_Usuario = ?',
      [Telefono, Torre_Bloque, Piso, Apartamento, id],
    );
  },

  /**
   * Convierte una fila cruda de la tabla `usuario` al formato
   * expuesto por la API (sin datos sensibles como la contrasena).
   *
   * @param {Object} row - Fila de la tabla usuario.
   * @returns {Object} Usuario publico: id, nombre, correo, rol, telefono, direccion.
   */
  toPublicUser(row) {
    return {
      id: row.ID_Usuario,
      nombre: row.Nombre,
      correo: row.Correo,
      rol: row.Rol,
      telefono: row.Telefono,
      direccion: row.Direccion,
    };
  },
};

export default userModel;
