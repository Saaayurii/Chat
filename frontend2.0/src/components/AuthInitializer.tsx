'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthInitializer() {
  const { initializeAuth, setLoading } = useAuthStore();

  useEffect(() => {
    // Устанавливаем loading в true перед инициализацией
    setLoading(true);
    
    // Небольшая задержка, чтобы убедиться что Zustand persist загрузился
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeAuth, setLoading]);

  return null;
}