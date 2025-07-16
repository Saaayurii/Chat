'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import Navbar from '@/components/Navigation/Navbar';
import { Footer } from '../UI';

interface AppLayoutProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login', '/registration', '/reset', '/reset-password'];
const visitorRoutes = ['/widget-demo'];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  const isPublicRoute = publicRoutes.includes(pathname);
  const isVisitorRoute = visitorRoutes.includes(pathname);
  
  // Показываем навигацию только для админов и операторов
  const showNavbar = isAuthenticated && !isPublicRoute && !isVisitorRoute && 
                     user && (user.role === UserRole.ADMIN || user.role === UserRole.OPERATOR);
  
  // Показываем футер только для админов и операторов
  const showFooter = !isVisitorRoute && 
                     user && (user.role === UserRole.ADMIN || user.role === UserRole.OPERATOR);

  return (
    <>
      <div className="min-h-screen bg-background">
        {showNavbar && <Navbar />}
        <main className={showNavbar ? 'pt-0' : 'min-h-screen'}>
          {children}
        </main>
      </div>
      {showFooter && <Footer />}
    </>
  );
}