import type { User, LoginCredentials, RegisterData } from '../models';

const API = 'http://localhost:3001/api';

function mapUser(row: any): User {
  return {
    id: row.ID_Usuario || row.id,
    firstName: (row.Nombre || row.nombre || '').split(' ')[0],
    lastName: (row.Nombre || row.nombre || '').split(' ').slice(1).join(' ') || '',
    email: row.Correo || row.correo,
    isAdmin: (row.Rol || row.rol) === 'admin',
  };
}

export const authService = {
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

  async register(data: RegisterData): Promise<User> {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Nombre: `${data.firstName} ${data.lastName}`.trim(),
        Correo: data.email,
        Contrasena: data.password,
        Direccion: data.address || '',
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

  async logout(): Promise<void> {
    return;
  },
};
