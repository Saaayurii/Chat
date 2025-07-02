'use client';

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import QuestionsManagement from '@/components/Questions/QuestionsManagement';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorQuestionsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.OPERATOR)) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>;
  }

  if (!user || user.role !== UserRole.OPERATOR) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuestionsManagement userRole={UserRole.OPERATOR} showCreateForm={false} />
    </div>
  );
}