"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { Loading } from '@/components/UI';

const ChatPage: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Редирект оператора на его интерфейс
      if (user.role === UserRole.OPERATOR) {
        router.replace('/admin/statistics');
        return;
      }
      
      // Редирект админа на его интерфейс
      if (user.role === UserRole.ADMIN) {
        router.replace('/admin/statistics');
        return;
      }
    }
  }, [user, isLoading, router]);

  // Показываем лоадер пока определяем роль
  if (isLoading || (user && (user.role === UserRole.OPERATOR || user.role === UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loading className="mx-auto mb-4" />
          <p className="text-gray-600">Переадресация...</p>
        </div>
      </div>
    );
  }

  // Для посетителей или неавторизованных пользователей показываем информацию о чате
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Чат поддержки
          </h1>
          <p className="text-gray-600">
            Нажмите на иконку чата в правом нижнем углу, чтобы начать общение
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Добро пожаловать в чат поддержки!
            </h2>
            <p className="text-gray-600 text-sm">
              Мы готовы помочь вам с любыми вопросами. Наши операторы онлайн и готовы к общению.
            </p>
          </div>
          
          <div className="text-sm text-gray-500 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Операторы в сети</span>
            </div>
            <div>Среднее время ответа: 2-3 минуты</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;