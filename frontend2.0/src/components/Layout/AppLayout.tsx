'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navigation/Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login', '/registration', '/reset', '/reset-password'];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const isPublicRoute = publicRoutes.includes(pathname);
  const showNavbar = isAuthenticated && !isPublicRoute;

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? '' : 'min-h-screen'}>
        {children}
      </main>
    </div>
  );
}