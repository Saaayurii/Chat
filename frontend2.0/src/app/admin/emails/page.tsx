'use client';

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import EmailNotifications from '@/components/Email/EmailNotifications';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEmailsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.ADMIN)) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EmailNotifications userRole={UserRole.ADMIN} />
    </div>
  );
}