/**
 * @fileoverview Servicio de autenticacion.
 * Capa de acceso a datos: traduce las llamadas de la aplicacion a
 * peticiones HTTP contra el backend y normaliza las respuestas al
 * modelo `User` del cliente (arquitectura MVC - Service/DAO).
 */
import type { User, UserRole, LoginCredentials, RegisterData } from '../models';

/** URL base de la API REST del backend. */
const API = 'http://localhost:3001/api';

/**
 * Normaliza el rol crudo del backend a `UserRole`.
 *
 * @param {any} raw - Rol crudo (`admin`, `domiciliario`, `cliente`;
 *   legados `empleado` -> domiciliario, `usuario` -> cliente).
 * @returns {UserRole} Rol normalizado.
 */
function mapRole(raw: any): UserRole {
  if (raw === 'admin') return 'admin';
  if (raw === 'empleado' || raw === 'domiciliario') return 'domiciliario';
  return 'cliente';
}

/**
 * Convierte una fila cruda del backend (columnas en espanol) al
 * modelo `User` del cliente.
 *
 * @param {any} row - Respuesta del endpoint /auth/login.
 * @returns {User} Usuario normalizado para la interfaz.
 */
function mapUser(row: any): User {
  const role = mapRole(row.Rol || row.rol);
  return {
    id: row.ID_Usuario || row.id,
    firstName: (row.Nombre || row.nombre || '').split(' ')[0],
    lastName: (row.Nombre || row.nombre || '').split(' ').slice(1).join(' ') || '',
    email: row.Correo || row.correo,
    isAdmin: role === 'admin',
    role,
    photo: row.Foto || row.foto || null,
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
        Telefono: data.phone,
        Direccion: '',
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error || 'Error al registrar');
    return {
      id: body?.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isAdmin: false,
      role: 'cliente',
      photo: null,
    };
  },

  /**
   * Cierra la sesion. La sesion del controller se limpia aparte.
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    return;
  },

  /**
   * Solicita una clave temporal para el correo indicado.
   *
   * @param {string} email - Correo de la cuenta.
   * @returns {Promise<string>} La clave temporal generada.
   * @throws {Error} Si el backend rechaza la solicitud.
   */
  async recoverPassword(email: string): Promise<string> {
    const res = await fetch(`${API}/auth/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo: email }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'No fue posible recuperar la clave.');
    return data.tempPassword;
  },

  /**
   * Cambia la contrasena del usuario autenticado.
   *
   * @param {string} email - Correo de la cuenta.
   * @param {string} currentPassword - Contrasena actual.
   * @param {string} newPassword - Nueva contrasena.
   * @returns {Promise<void>}
   * @throws {Error} Si la actual no coincide o el cambio falla.
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo: email, ContrasenaActual: currentPassword, ContrasenaNueva: newPassword }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'No fue posible actualizar la contrasena.');
  },
};
