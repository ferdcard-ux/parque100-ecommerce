/**
 * @fileoverview Servicio de autenticacion.
 * Capa de acceso a datos: traduce las llamadas de la aplicacion a
 * peticiones HTTP contra el backend y normaliza las respuestas al
 * modelo `User` del cliente (arquitectura MVC - Service/DAO).
 */
import type { User, UserRole, LoginCredentials, RegisterData } from '../models';
import { normalizeUserRole } from '../models';
import { API_BASE as API, authHeaders, setAuthToken } from './api';

/**
 * Normaliza el rol crudo del backend a `UserRole`.
 *
 * @param {any} raw - Rol crudo (`admin`, `domiciliario`, `cliente`;
 *   legados `empleado` -> domiciliario, `usuario` -> cliente).
 * @returns {UserRole} Rol normalizado.
 */
function mapRole(raw: any): UserRole {
  return normalizeUserRole(raw);
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
    token: row.token ?? null,
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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo: credentials.email, Contrasena: credentials.password }),
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const data = await res.json();
    const user = mapUser(data);
    setAuthToken(user.token ?? null);
    return user;
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
    setAuthToken(body?.token ?? null);
    return {
      id: body?.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isAdmin: false,
      role: 'cliente',
      photo: null,
      token: body?.token ?? null,
    };
  },

  /**
   * Cierra la sesion. La sesion del controller se limpia aparte.
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
      });
    } finally {
      setAuthToken(null);
    }
    if (!res.ok) throw new Error('No fue posible cerrar la sesión en el servidor.');
  },

  async getDisclaimerStatus(): Promise<{ accepted: boolean; version: string }> {
    const res = await fetch(`${API}/auth/disclaimer/status`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) throw new Error('SITE_SESSION_INVALID');
      if (res.status === 403) throw new Error('SITE_ACCESS_DENIED');
      throw new Error(body?.error || 'No fue posible verificar la autorización.');
    }
    return body;
  },

  async acceptDisclaimer(version: string): Promise<void> {
    const res = await fetch(`${API}/auth/disclaimer/accept`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ version }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error || 'No fue posible guardar la aceptación.');
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
