'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    const role = token && user ? (() => {
      try {
        return JSON.parse(user)?.role;
      } catch {
        return null;
      }
    })() : null;

    role === 'admin'
      ? router.push('/admin/statistics')
      : role === 'operator'
        ? router.push('/operator/statistics')
        : router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Загрузка...</p>
      </div>
    </div>
  );
}
