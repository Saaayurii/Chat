'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI, RegistrationData } from '@/core/api';

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
  const {0: showPassword, 1: setShowPassword} = useState(false);
  const {0: showPasswordConfirm, 1: setShowPasswordConfirm} = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Регистрация
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Полное имя:
              </label>
              <input
                type="text"
                id="fullName"
                placeholder="Андрей Иванов"
                {...register('fullName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
              {errors.fullName ? <div className="text-red-500 text-sm mt-1">{errors.fullName.message}</div> : null}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя:
              </label>
              <input
                type="text"
                id="username"
                placeholder="andrey_123"
                {...register('username')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
              <small className="text-gray-600 text-xs">
                Только латинские буквы, цифры, _ и -, минимум 3 символа
              </small>
              {errors.username ? <div className="text-red-500 text-sm mt-1">{errors.username.message}</div> : null}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email:
              </label>
              <input
                type="email"
                id="email"
                placeholder="user@example.com"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
              {errors.email ? <div className="text-red-500 text-sm mt-1">{errors.email.message}</div> : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="MyPassword123!"
                  {...register('password')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <small className="text-gray-600 text-xs">
                Минимум 8 символов: заглавная, строчная, цифра, спецсимвол (@$!%*?&)
              </small>
              {errors.password ? <div className="text-red-500 text-sm mt-1">{errors.password.message}</div> : null}
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                Повторите пароль:
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  id="passwordConfirm"
                  placeholder="Повторите пароль"
                  {...register('passwordConfirm')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.passwordConfirm ? <div className="text-red-500 text-sm mt-1">{errors.passwordConfirm.message}</div> : null}
            </div>

            <button
              type="submit"
              disabled={registrationMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {registrationMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>

            {errors.root ? <div className="text-red-500 text-sm text-center mt-4 whitespace-pre-line">
              {errors.root.message}
            </div> : null}

            <div className="text-center space-y-2">
              <a 
                href="/reset" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Забыли пароль?
              </a>
              <br />
              <a 
                href="/login" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Уже есть аккаунт? Войти
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}