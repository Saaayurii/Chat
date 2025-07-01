'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Save, Lock, Bell, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/core/api';
import * as Radix from '@radix-ui/themes';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 
      'Пароль должен содержать заглавную букву, строчную букву, цифру и спецсимвол'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Настройки уведомлений
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    desktop: false,
    newMessages: true,
    systemUpdates: false
  });

  // Настройки приватности
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    allowDirectMessages: true,
    showLastSeen: false
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      // Здесь будет вызов API для смены пароля
      // Пока заглушка
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      reset();
      // Показать уведомление об успехе
    }
  });

  const onSubmitPassword = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-600">Управляйте настройками вашего аккаунта</p>
        </div>

        <div className="space-y-8">
          {/* Смена пароля */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Безопасность
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текущий пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...register('currentPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...register('newPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подтвердите новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {changePasswordMutation.isPending ? 'Сохранение...' : 'Изменить пароль'}
                </button>
              </form>
            </div>
          </div>

          {/* Уведомления */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Уведомления
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email уведомления</h4>
                  <p className="text-sm text-gray-500">Получать уведомления на email</p>
                </div>
                <Radix.Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Push уведомления</h4>
                  <p className="text-sm text-gray-500">Получать push уведомления в браузере</p>
                </div>
                <Radix.Switch 
                  checked={notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Уведомления на рабочем столе</h4>
                  <p className="text-sm text-gray-500">Показывать уведомления на рабочем столе</p>
                </div>
                <Radix.Switch 
                  checked={notifications.desktop}
                  onCheckedChange={(checked) => handleNotificationChange('desktop', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Новые сообщения</h4>
                  <p className="text-sm text-gray-500">Уведомления о новых сообщениях</p>
                </div>
                <Radix.Switch 
                  checked={notifications.newMessages}
                  onCheckedChange={(checked) => handleNotificationChange('newMessages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Системные обновления</h4>
                  <p className="text-sm text-gray-500">Уведомления об обновлениях системы</p>
                </div>
                <Radix.Switch 
                  checked={notifications.systemUpdates}
                  onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
                />
              </div>
            </div>
          </div>

          {/* Приватность */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Приватность
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Показывать статус онлайн</h4>
                  <p className="text-sm text-gray-500">Другие пользователи смогут видеть, что вы онлайн</p>
                </div>
                <Radix.Switch 
                  checked={privacy.showOnlineStatus}
                  onCheckedChange={(checked) => handlePrivacyChange('showOnlineStatus', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Разрешить личные сообщения</h4>
                  <p className="text-sm text-gray-500">Позволить другим пользователям писать вам напрямую</p>
                </div>
                <Radix.Switch 
                  checked={privacy.allowDirectMessages}
                  onCheckedChange={(checked) => handlePrivacyChange('allowDirectMessages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Показывать время последнего посещения</h4>
                  <p className="text-sm text-gray-500">Другие увидят, когда вы были онлайн в последний раз</p>
                </div>
                <Radix.Switch 
                  checked={privacy.showLastSeen}
                  onCheckedChange={(checked) => handlePrivacyChange('showLastSeen', checked)}
                />
              </div>
            </div>
          </div>

          {/* Информация об аккаунте */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Информация об аккаунте</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID пользователя</label>
                  <p className="text-sm text-gray-900 font-mono">{user?.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Дата регистрации</label>
                  <p className="text-sm text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Неизвестно'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Статус активации</label>
                  <Radix.Badge 
                    color={user?.isActivated ? 'green' : 'orange'} 
                    variant="soft"
                  >
                    {user?.isActivated ? 'Активирован' : 'Не активирован'}
                  </Radix.Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Последнее обновление</label>
                  <p className="text-sm text-gray-900">
                    {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Неизвестно'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}