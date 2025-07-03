'use client';

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import RatingsManagement from '@/components/Ratings/RatingsManagement';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserRatingsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.VISITOR)) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-background text-muted-foreground">Загрузка...</div>;
  }

  if (!user || user.role !== UserRole.VISITOR) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <RatingsManagement userRole={UserRole.VISITOR} />
      </div>
    </div>
  );
}