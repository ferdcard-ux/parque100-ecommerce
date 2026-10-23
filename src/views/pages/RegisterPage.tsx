import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../../App';
import { RegisterForm } from '../components/auth/RegisterForm';
import { isSafeRedirectPath } from '../../utils/validators';

export function RegisterPage() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next');
  const nextPath = isSafeRedirectPath(rawNext) ? rawNext : '/';

  const handleRegister = async (data: { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string }) => {
    await register(data);
    navigate(nextPath);
  };

  return <RegisterForm onRegister={handleRegister} />;
}
