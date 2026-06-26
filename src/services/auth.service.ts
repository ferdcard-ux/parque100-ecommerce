import type { User, LoginCredentials, RegisterData } from '../models';

const MOCK_USER: User = {
  id: 1,
  firstName: 'Usuario',
  lastName: 'Demo',
  email: 'usuario@ejemplo.com',
  isAdmin: false,
};

const MOCK_ADMIN: User = {
  id: 2,
  firstName: 'Admin',
  lastName: 'Parque100',
  email: 'admin@parque100.com',
  isAdmin: true,
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const isAdmin =
      credentials.email === 'admin@parque100.com' &&
      credentials.password === 'admin123';
    const isUser =
      credentials.email === 'usuario@ejemplo.com' &&
      credentials.password === '12345678';

    if (isAdmin) return MOCK_ADMIN;
    if (isUser) return MOCK_USER;

    throw new Error('Credenciales inválidas');
  },

  async register(data: RegisterData): Promise<User> {
    return {
      id: Date.now(),
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
