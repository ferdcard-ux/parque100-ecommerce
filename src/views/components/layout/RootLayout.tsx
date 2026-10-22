import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import type { User, UserRole } from '../../../models';

interface RootLayoutProps {
  cartCount: number;
  isAdmin: boolean;
  isLoggedIn: boolean;
  user: User | null;
  userRole?: UserRole | null;
  sessions: User[];
  onSwitchSession: (id: number) => void;
  onLogout: () => void;
}

export function RootLayout({ cartCount, isAdmin, isLoggedIn, user, userRole, sessions, onSwitchSession, onLogout }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-brand-red focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <Navbar
        cartCount={cartCount}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        user={user}
        userRole={userRole}
        sessions={sessions}
        onSwitchSession={onSwitchSession}
        onLogout={onLogout}
      />
      <div className="pt-16">
        <main id="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
