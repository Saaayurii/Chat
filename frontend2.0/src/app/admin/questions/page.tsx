'use client';

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import QuestionsManagement from '@/components/Questions/QuestionsManagement';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminQuestionsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.ADMIN)) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      <QuestionsManagement userRole={UserRole.ADMIN} />
    </div>
  );
}