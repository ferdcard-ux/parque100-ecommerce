import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import type { User } from '../../../models';

interface RootLayoutProps {
  cartCount: number;
  isAdmin: boolean;
  isLoggedIn: boolean;
  user: User | null;
  onLogout: () => void;
}

export function RootLayout({ cartCount, isAdmin, isLoggedIn, user, onLogout }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar
        cartCount={cartCount}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={onLogout}
      />
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}
