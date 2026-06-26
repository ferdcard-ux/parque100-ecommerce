import { Outlet } from 'react-router';
import { Navbar } from './Navbar';

interface RootLayoutProps {
  cartCount: number;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export function RootLayout({ cartCount, isAdmin, isLoggedIn }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar
        cartCount={cartCount}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
      />
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}
