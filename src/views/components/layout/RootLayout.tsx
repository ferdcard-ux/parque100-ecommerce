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
        <Outlet />
      </div>
    </div>
  );
}
