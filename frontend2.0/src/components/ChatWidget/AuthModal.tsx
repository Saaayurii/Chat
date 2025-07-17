'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { authAPI, LoginData, RegistrationData, ResetPasswordData } from '@/core/api';
import { useAuthStore } from '@/store/authStore';

import Button from '../UI/Button';
import { Input } from '../UI/Input';
import { Label } from '../UI/Label';
import { Alert } from '../UI/Alert';
import Modal from '../UI/Modal';

type AuthMode = 'login' | 'register' | 'reset' | 'reset-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthSuccess?: (token: string, user: any) => void;
}

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль')
});

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

const resetEmailSchema = z.object({
  email: z.string().email('Введите корректный email')
});

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Пароль должен содержать хотя бы один специальный символ'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegistrationFormData = z.infer<typeof registrationSchema>;
type ResetEmailFormData = z.infer<typeof resetEmailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  
  const { setAuth } = useAuthStore();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  // Registration form
  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  });

  // Reset email form
  const resetEmailForm = useForm<ResetEmailFormData>({
    resolver: zodResolver(resetEmailSchema)
  });

  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await authAPI.login(data);
      return response.data;
    },
    onSuccess: (result) => {
      if (result.access_token) {
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
        onAuthSuccess?.(result.access_token, userData);
        onClose();
      } else {
        loginForm.setError('root', { message: 'Не удалось получить токен доступа.' });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
        `Ошибка ${error.response?.status}. Неверный email или пароль.` ||
        'Не удалось подключиться к серверу. Проверьте ваше соединение.';
      loginForm.setError('root', { message });
    }
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const { passwordConfirm, ...registrationData } = data;
      const response = await authAPI.register(registrationData);
      return response.data;
    },
    onSuccess: (result) => {
      setMode('login');
      loginForm.setValue('email', registrationForm.getValues('email'));
      alert('Регистрация успешна! Войдите в систему с новыми данными.');
    },
    onError: (error: any) => {
      const errorMessage = Array.isArray(error.response?.data?.message) 
        ? error.response.data.message.join('\n') 
        : error.response?.data?.message 
        ? error.response.data.message 
        : `Ошибка ${error.response?.status}. Попробуйте еще раз.` || 
        'Не удалось подключиться к серверу. Проверьте ваше соединение.';
      registrationForm.setError('root', { message: errorMessage });
    }
  });

  const resetEmailMutation = useMutation({
    mutationFn: async (data: ResetEmailFormData) => {
      const response = await authAPI.forgotPassword(data);
      return response.data;
    },
    onSuccess: () => {
      setResetEmailSent(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
        'Произошла ошибка при отправке письма. Попробуйте снова.';
      resetEmailForm.setError('root', { message });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      if (!resetToken) {
        throw new Error('Токен не найден');
      }
      
      const resetData: ResetPasswordData = {
        token: resetToken,
        newPassword: data.newPassword
      };
      
      const response = await authAPI.resetPassword(resetData);
      return response.data;
    },
    onSuccess: () => {
      setIsResetSuccess(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 
        error.message ||
        'Произошла ошибка при сбросе пароля. Попробуйте снова.';
      resetPasswordForm.setError('root', { message });
    }
  });

  const handleClose = () => {
    setMode('login');
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setResetEmailSent(false);
    setResetToken(null);
    setIsResetSuccess(false);
    loginForm.reset();
    registrationForm.reset();
    resetEmailForm.reset();
    resetPasswordForm.reset();
    onClose();
  };

  const renderLoginForm = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600">Введите ваши данные для входа</p>
      </div>

      <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...loginForm.register('email')}
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-red-600 mt-1">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...loginForm.register('password')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-red-600 mt-1">
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Вход...' : 'Войти'}
        </Button>

        {loginForm.formState.errors.root && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-red-800">
              <p className="font-medium">Ошибка</p>
              <p className="text-sm">{loginForm.formState.errors.root.message}</p>
            </div>
          </Alert>
        )}
      </form>

      <div className="text-center space-y-2">
        <button
          onClick={() => setMode('reset')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Забыли пароль?
        </button>
        <div className="text-sm">
          Нет аккаунта?{" "}
          <button
            onClick={() => setMode('register')}
            className="text-blue-600 hover:text-blue-800"
          >
            Регистрация
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-600">Создайте аккаунт для доступа к системе</p>
      </div>

      <form onSubmit={registrationForm.handleSubmit((data) => registrationMutation.mutate(data))} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Полное имя</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Андрей Иванов"
            {...registrationForm.register('fullName')}
          />
          {registrationForm.formState.errors.fullName && (
            <p className="text-sm text-red-600 mt-1">
              {registrationForm.formState.errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="username">Имя пользователя</Label>
          <Input
            id="username"
            type="text"
            placeholder="andrey_123"
            {...registrationForm.register('username')}
          />
          <p className="text-xs text-gray-600 mt-1">
            Только латинские буквы, цифры, _ и -, минимум 3 символа
          </p>
          {registrationForm.formState.errors.username && (
            <p className="text-sm text-red-600 mt-1">
              {registrationForm.formState.errors.username.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            {...registrationForm.register('email')}
          />
          {registrationForm.formState.errors.email && (
            <p className="text-sm text-red-600 mt-1">
              {registrationForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="MyPassword123!"
              {...registrationForm.register('password')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Минимум 8 символов: заглавная, строчная, цифра, спецсимвол (@$!%*?&)
          </p>
          {registrationForm.formState.errors.password && (
            <p className="text-sm text-red-600 mt-1">
              {registrationForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="passwordConfirm">Повторите пароль</Label>
          <div className="relative">
            <Input
              id="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="Повторите пароль"
              {...registrationForm.register('passwordConfirm')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {registrationForm.formState.errors.passwordConfirm && (
            <p className="text-sm text-red-600 mt-1">
              {registrationForm.formState.errors.passwordConfirm.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={registrationMutation.isPending}
        >
          {registrationMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>

        {registrationForm.formState.errors.root && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-red-800">
              <p className="font-medium">Ошибка</p>
              <p className="text-sm whitespace-pre-line">{registrationForm.formState.errors.root.message}</p>
            </div>
          </Alert>
        )}
      </form>

      <div className="text-center">
        <div className="text-sm">
          Уже есть аккаунт?{" "}
          <button
            onClick={() => setMode('login')}
            className="text-blue-600 hover:text-blue-800"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );

  const renderResetEmailForm = () => {
    if (resetEmailSent) {
      return (
        <div className="text-center space-y-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Письмо отправлено</h2>
          <p className="text-gray-600">
            Проверьте вашу почту и перейдите по ссылке для сброса пароля
          </p>
          <Button
            onClick={() => setMode('login')}
            className="w-full"
          >
            Вернуться к входу
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Сброс пароля</h2>
          <p className="text-gray-600 mt-2">Введите email для получения ссылки</p>
        </div>

        <form onSubmit={resetEmailForm.handleSubmit((data) => resetEmailMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...resetEmailForm.register('email')}
            />
            {resetEmailForm.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {resetEmailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={resetEmailMutation.isPending}
          >
            {resetEmailMutation.isPending ? 'Отправка...' : 'Отправить ссылку'}
          </Button>

          {resetEmailForm.formState.errors.root && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-red-800">
                <p className="font-medium">Ошибка</p>
                <p className="text-sm">{resetEmailForm.formState.errors.root.message}</p>
              </div>
            </Alert>
          )}
        </form>

        <div className="text-center">
          <button
            onClick={() => setMode('login')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  };

  const renderResetPasswordForm = () => {
    if (isResetSuccess) {
      return (
        <div className="text-center space-y-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Пароль изменен</h2>
          <p className="text-gray-600">
            Ваш пароль был успешно изменен. Теперь вы можете войти в систему.
          </p>
          <Button
            onClick={() => setMode('login')}
            className="w-full"
          >
            Войти в систему
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Новый пароль</h2>
          <p className="text-gray-600 mt-2">Введите новый пароль для вашего аккаунта</p>
        </div>

        <form onSubmit={resetPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Новый пароль</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                {...resetPasswordForm.register('newPassword')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {resetPasswordForm.formState.errors.newPassword && (
              <p className="text-sm text-red-600 mt-1">
                {resetPasswordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswordConfirm ? 'text' : 'password'}
                {...resetPasswordForm.register('confirmPassword')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {resetPasswordForm.formState.errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {resetPasswordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">Требования к паролю:</p>
            <ul className="space-y-1 text-xs">
              <li>• Минимум 8 символов</li>
              <li>• Хотя бы одна заглавная буква</li>
              <li>• Хотя бы одна строчная буква</li>
              <li>• Хотя бы одна цифра</li>
              <li>• Хотя бы один специальный символ</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? 'Изменение...' : 'Изменить пароль'}
          </Button>

          {resetPasswordForm.formState.errors.root && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-red-800">
                <p className="font-medium">Ошибка</p>
                <p className="text-sm">{resetPasswordForm.formState.errors.root.message}</p>
              </div>
            </Alert>
          )}
        </form>

        <div className="text-center">
          <button
            onClick={() => setMode('login')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'register':
        return 'Регистрация';
      case 'reset':
        return resetEmailSent ? 'Письмо отправлено' : 'Сброс пароля';
      case 'reset-password':
        return isResetSuccess ? 'Пароль изменен' : 'Новый пароль';
      default:
        return 'Вход в систему';
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'register':
        return renderRegistrationForm();
      case 'reset':
        return renderResetEmailForm();
      case 'reset-password':
        return renderResetPasswordForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={getModalTitle()}
      size="sm"
    >
      {renderContent()}
    </Modal>
  );
};

export default AuthModal;