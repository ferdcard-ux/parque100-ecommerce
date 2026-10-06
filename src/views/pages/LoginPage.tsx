/**
 * @fileoverview Pagina de inicio de sesion.
 * Soporta retorno post-login (`?next=`) y multisesion (`?mode=switch`).
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../../App';
import { LoginForm } from '../components/auth/LoginForm';
import { isValidEmail } from '../../utils';

export function LoginPage() {
  const { login, isLoggedIn, user } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get('next') || '/';
  const switchMode = searchParams.get('mode') === 'switch';

  const handleLogin = async (credentials: { email: string; password: string; remember?: boolean }) => {
    setError(null);
    if (!isValidEmail(credentials.email)) {
      setError('Ingresa un correo electrónico válido.');
      throw new Error('Correo inválido');
    }
    if (credentials.password.length === 0) {
      setError('Ingresa tu contraseña.');
      throw new Error('Contraseña vacía');
    }
    try {
      await login(credentials);
      navigate(nextPath.startsWith('/') ? nextPath : '/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setError(message);
      throw err;
    }
  };

  const handleAdminLogin = async (credentials: { email: string; password: string; remember?: boolean }) => {
    await login(credentials);
    navigate(nextPath.startsWith('/') ? nextPath : '/');
  };

  return (
    <LoginForm
      onLogin={handleLogin}
      onAdminLogin={handleAdminLogin}
      error={error}
      nextPath={nextPath}
      switchMode={switchMode && isLoggedIn}
      currentUserName={user ? `${user.firstName} ${user.lastName}` : null}
    />
  );
}
