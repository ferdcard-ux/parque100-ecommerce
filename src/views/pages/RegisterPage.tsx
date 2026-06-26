import { useNavigate } from 'react-router';
import { useApp } from '../../App';
import { RegisterForm } from '../components/auth/RegisterForm';

export function RegisterPage() {
  const { register } = useApp();
  const navigate = useNavigate();

  const handleRegister = async (data: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => {
    await register(data);
    navigate('/login');
  };

  return <RegisterForm onRegister={handleRegister} />;
}
