'use client';

import Image from "next/image";
import Link from "next/link";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authAPI, LoginData } from '@/core/api';

import  Button  from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";

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
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Вход в систему
            </h1>
            <p className="text-balance text-muted-foreground">
              Введите ваш email для входа в аккаунт
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white"
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Пароль
                </Label>
                <Link
                  href="/reset"
                  className="ml-auto inline-block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Забыли пароль?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Вход...' : 'Войти'}
            </Button>
            {errors.root && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {errors.root.message}
              </p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Нет аккаунта?{" "}
            <Link 
              href="/registration" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Добро пожаловать!</h2>
            <p className="text-xl opacity-90">
              Войдите в систему для продолжения работы
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}