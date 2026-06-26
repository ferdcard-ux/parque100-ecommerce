import { useNavigate } from 'react-router';
import { useApp } from '../../App';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    navigate('/');
  };

  const handleAdminLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    navigate('/');
  };

  return <LoginForm onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
}
