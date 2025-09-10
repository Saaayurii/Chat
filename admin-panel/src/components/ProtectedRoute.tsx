+'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Ждем пока загрузится состояние аутентификации
    if (isLoading) return;
    // Если не аутентифицирован, перенаправляем на логин
    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }
    // Если требуется определенная роль, проверяем её
    if (requiredRole && user.role !== requiredRole) {
      // Перенаправляем в зависимости от роли
      switch (user.role) {
        case UserRole.ADMIN:
          router.push('/admin/statistics');
          break;
        case UserRole.OPERATOR:
          router.push('/operator/statistics');
          break;
        case UserRole.VISITOR:
          router.push('/chat');
          break;
        default:
          router.push('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRole, router, redirectTo]);

  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если не аутентифицирован, показываем пустую страницу (пока идет редирект)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Если требуется определенная роль и она не совпадает, показываем пустую страницу
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}