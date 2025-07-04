'use client';

import Link from "next/link";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI, RegistrationData } from '@/core/api';

import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import Button from "@/components/UI/Button";

const registrationSchema = z.object({
  fullName: z.string().min(1, 'Введите полное имя'),
  username: z.string()
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Только латинские буквы, цифры, _ и -'),
  email: z.string().email('Введите корректный email'),
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 
      'Пароль должен содержать заглавную букву, строчную букву, цифру и спецсимвол (@$!%*?&)'),
  passwordConfirm: z.string()
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Пароли не совпадают",
  path: ["passwordConfirm"],
});

type RegistrationFormData = RegistrationData & { passwordConfirm: string };

export default function RegistrationPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const { passwordConfirm, ...registrationData } = data;
      const response = await authAPI.register(registrationData);
      return response.data;
    },
    onSuccess: (result) => {
      alert('Регистрация успешна! Проверьте email для подтверждения аккаунта.');
      router.push('/login');
    },
    onError: (error: any) => {
      const errorMessage = Array.isArray(error.response?.data?.message) ? error.response.data.message.join('\n') : error.response?.data?.message ? error.response.data.message : `Ошибка ${error.response?.status}. Попробуйте еще раз.` || 'Не удалось подключиться к серверу. Проверьте ваше соединение.';
      setError('root', { message: errorMessage });
    }
  });

  const onSubmit = (data: RegistrationFormData) => {
    registrationMutation.mutate(data);
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Регистрация
            </h1>
            <p className="text-balance text-muted-foreground">
              Создайте аккаунт для доступа к системе
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
                Полное имя
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Андрей Иванов"
                {...register('fullName')}
                className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">
                Имя пользователя
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="andrey_123"
                {...register('username')}
                className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Только латинские буквы, цифры, _ и -, минимум 3 символа
              </p>
              {errors.username && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
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
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="MyPassword123!"
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
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Минимум 8 символов: заглавная, строчная, цифра, спецсимвол (@$!%*?&)
              </p>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="passwordConfirm" className="text-gray-700 dark:text-gray-300">
                Повторите пароль
              </Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  placeholder="Повторите пароль"
                  {...register('passwordConfirm')}
                  className="bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-300"
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.passwordConfirm && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={registrationMutation.isPending}
            >
              {registrationMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>

            {errors.root && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center whitespace-pre-line">
                {errors.root.message}
              </p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Уже есть аккаунт?{" "}
            <Link 
              href="/login" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Присоединяйтесь!</h2>
            <p className="text-xl opacity-90">
              Создайте аккаунт и начните использовать систему уже сегодня
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}