/**
 * @fileoverview Servicio de autenticacion.
 * Capa de acceso a datos: traduce las llamadas de la aplicacion a
 * peticiones HTTP contra el backend y normaliza las respuestas al
 * modelo `User` del cliente (arquitectura MVC - Service/DAO).
 */
import type { User, LoginCredentials, RegisterData } from '../models';

/** URL base de la API REST del backend. */
const API = 'http://localhost:3001/api';

/**
 * Convierte una fila cruda del backend (columnas en espanol) al
 * modelo `User` del cliente.
 *
 * @param {any} row - Respuesta del endpoint /auth/login.
 * @returns {User} Usuario normalizado para la interfaz.
 */
function mapUser(row: any): User {
  return {
    id: row.ID_Usuario || row.id,
    firstName: (row.Nombre || row.nombre || '').split(' ')[0],
    lastName: (row.Nombre || row.nombre || '').split(' ').slice(1).join(' ') || '',
    email: row.Correo || row.correo,
    isAdmin: (row.Rol || row.rol) === 'admin',
  };
}

/**
 * Servicio de autenticacion.
 * @namespace authService
 */
export const authService = {
  /**
   * Inicia sesion contra el backend.
   *
   * @param {LoginCredentials} credentials - Correo y contrasena.
   * @returns {Promise<User>} Usuario autenticado.
   * @throws {Error} 'Credenciales inválidas' si el backend responde != 2xx.
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo: credentials.email, Contrasena: credentials.password }),
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const data = await res.json();
    return mapUser(data);
  },

  /**
   * Registra un nuevo usuario y devuelve su sesion local.
   *
   * @param {RegisterData} data - Datos del formulario de registro.
   * @returns {Promise<User>} Usuario creado (rol no-admin).
   * @throws {Error} 'Error al registrar' si el backend responde != 2xx.
   */
  async register(data: RegisterData): Promise<User> {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Nombre: `${data.firstName} ${data.lastName}`.trim(),
        Correo: data.email,
        Contrasena: data.password,
        Direccion: '',
      }),
    });
    if (!res.ok) throw new Error('Error al registrar');
    const result = await res.json();
    return {
      id: result.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isAdmin: false,
    };
  },

  /**
   * Cierra la sesion. La sesion vive en memoria del controlador,
   * por lo que aqui no hay llamada al backend.
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    return;
  },
};
