'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authAPI, LoginData } from '@/core/api';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль')
});

type LoginFormData = LoginData;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await authAPI.login(data);
      return response.data;
    },
    onSuccess: (result) => {
      result.access_token ? (() => {
        const userData = {
          id: result.user?._id || result.user?.id,
          _id: result.user?._id || result.user?.id,
          email: result.user?.email,
          role: result.user?.role,
          isActivated: result.user?.isActivated || false,
          isBlocked: result.user?.isBlocked || false,
          blacklistedByAdmin: result.user?.blacklistedByAdmin || false,
          blacklistedByOperator: result.user?.blacklistedByOperator || false,
          profile: result.user?.profile || {
            username: result.user?.email?.split('@')[0] || '',
            lastSeenAt: new Date(),
            isOnline: true
          },
          createdAt: result.user?.createdAt || new Date(),
          updatedAt: result.user?.updatedAt || new Date()
        };
        
        setAuth(result.access_token, userData);
        router.push('/admin/statistics');
      })() : setError('root', { message: 'Не удалось получить токен доступа.' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
        `Ошибка ${error.response?.status}. Неверный email или пароль.` ||
        'Не удалось подключиться к серверу. Проверьте ваше соединение.';
      setError('root', { message });
    }
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white dark:bg-dark-900 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
            Вход в систему
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Email:
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
              />
              {errors.email ? <div className="text-red-500 text-sm mt-1">{errors.email.message}</div> : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Пароль:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  {...register('password')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password ? <div className="text-red-500 text-sm mt-1">{errors.password.message}</div> : null}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginMutation.isPending ? 'Вход...' : 'Войти'}
            </button>

            {errors.root ? <div className="text-red-500 text-sm text-center mt-4">{errors.root.message}</div> : null}

            <div className="text-center space-y-2">
              <a 
                href="/reset" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                Забыли пароль?
              </a>
              <br />
              <a 
                href="/registration" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                Регистрация
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}