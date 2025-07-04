'use client';

import Image from "next/image";
import Link from "next/link";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail } from 'lucide-react';
import { authAPI, ForgotPasswordData } from '@/core/api';

import Button from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import { Alert } from "@/components/UI/Alert";

const forgotPasswordSchema = z.object({
  email: z.string().email('Введите корректный email')
});

type ForgotPasswordFormData = ForgotPasswordData;

export default function ResetPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await authAPI.forgotPassword(data);
      return response.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
        'Произошла ошибка при отправке письма. Попробуйте снова.';
      setError('root', { message });
    }
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[400px] gap-6">
            <div className="grid gap-2 text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Письмо отправлено
              </h1>
              <p className="text-balance text-muted-foreground">
                Инструкции по сбросу пароля отправлены на{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {getValues('email')}
                </span>
              </p>
            </div>
            
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Проверьте вашу почту</p>
                <p className="text-sm">
                  Мы отправили ссылку для сброса пароля на ваш email. 
                  Ссылка действительна в течение 1 часа.
                </p>
              </div>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Отправить письмо снова
              </Button>
              
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden bg-muted lg:block">
          <div className="h-full w-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
            <div className="text-center text-white">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-4xl font-bold mb-4">Проверьте почту</h2>
              <p className="text-xl opacity-90">
                Инструкции по сбросу пароля отправлены на ваш email
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Сброс пароля
            </h1>
            <p className="text-balance text-muted-foreground">
              Введите ваш email для получения инструкций по сбросу пароля
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

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? 'Отправка...' : 'Отправить инструкции'}
            </Button>
            
            {errors.root && (
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="text-red-800 dark:text-red-200">
                  <p className="font-medium">Ошибка</p>
                  <p className="text-sm">{errors.root.message}</p>
                </div>
              </Alert>
            )}
          </form>

          <div className="text-center">
            <Link 
              href="/login"
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="h-full w-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Забыли пароль?</h2>
            <p className="text-xl opacity-90">
              Не волнуйтесь, мы поможем вам восстановить доступ к аккаунту
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}