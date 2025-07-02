'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Save, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authAPI, profileAPI, UpdateProfileData } from '@/core/api';
import { User as UserType } from '@/types';
import * as Radix from '@radix-ui/themes';

const profileSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа').regex(/^[a-zA-Z0-9_-]+$/, 'Только латинские буквы, цифры, _ и -'),
  fullName: z.string().min(1, 'Введите полное имя'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Максимум 500 символов').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user: currentUser, setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const {0: isEditing, 1: setIsEditing} = useState(false);
  const {0: avatarFile, 1: setAvatarFile} = useState<File | null>(null);
  const {0: avatarPreview, 1: setAvatarPreview} = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authAPI.getProfile();
      return response.data.user;
    },
    initialData: currentUser
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.profile?.username || '',
      fullName: user?.profile?.fullName || '',
      phone: user?.profile?.phone || '',
      bio: user?.profile?.bio || '',
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileAPI.updateProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      // Обновляем данные в store
      if (currentUser && response.data) {
        setAuth(localStorage.getItem('access_token') || '', {
          ...currentUser,
          profile: { ...currentUser.profile, ...response.data }
        });
      }
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileAPI.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      username: user?.profile?.username || '',
      fullName: user?.profile?.fullName || '',
      phone: user?.profile?.phone || '',
      bio: user?.profile?.bio || '',
    });
  };

  return isLoading ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Radix.Spinner size="3" />
    </div>
  ) : (

    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600">Управляйте информацией вашего профиля</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : user?.profile?.avatarUrl ? (
                      <img 
                        src={user.profile?.avatarUrl} 
                        alt={user.profile?.fullName || user.profile?.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  
                  <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {avatarFile && (
                  <button
                    onClick={handleAvatarUpload}
                    disabled={uploadAvatarMutation.isPending}
                    className="mt-3 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {uploadAvatarMutation.isPending ? 'Загрузка...' : 'Сохранить фото'}
                  </button>
                )}

                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  {user?.profile?.fullName || user?.profile?.username}
                </h2>
                <p className="text-gray-500">{user?.email}</p>
                
                <Radix.Badge 
                  color={user?.role === 'admin' ? 'red' : user?.role === 'operator' ? 'blue' : 'gray'} 
                  variant="soft"
                  className="mt-2"
                >
                  {user?.role === 'admin' ? 'Администратор' : user?.role === 'operator' ? 'Оператор' : 'Посетитель'}
                </Radix.Badge>
              </div>

              {/* Quick Stats */}
              {user?.operatorStats && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Статистика</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Всего вопросов:</span>
                      <span className="text-sm font-medium">{user.operatorStats.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Решено:</span>
                      <span className="text-sm font-medium">{user.operatorStats.resolvedQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Рейтинг:</span>
                      <span className="text-sm font-medium">{user.operatorStats.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Личная информация</h3>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Редактировать
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="inline w-4 h-4 mr-1" />
                          Имя пользователя
                        </label>
                        <input
                          type="text"
                          {...register('username')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                        {errors.username && (
                          <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="inline w-4 h-4 mr-1" />
                          Полное имя
                        </label>
                        <input
                          type="text"
                          {...register('fullName')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                        {errors.fullName && (
                          <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline w-4 h-4 mr-1" />
                        Телефон
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="+7 (999) 999-99-99"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="inline w-4 h-4 mr-1" />
                        О себе
                      </label>
                      <textarea
                        {...register('bio')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="Расскажите о себе..."
                      />
                      {errors.bio && (
                        <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Имя пользователя
                        </label>
                        <p className="text-gray-900">{user?.profile?.username}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Полное имя
                        </label>
                        <p className="text-gray-900">{user?.profile?.fullName || 'Не указано'}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон
                      </label>
                      <p className="text-gray-900">{user?.profile?.phone || 'Не указан'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        О себе
                      </label>
                      <p className="text-gray-900">{user?.profile?.bio || 'Не указано'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата регистрации
                      </label>
                      <p className="text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Неизвестно'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}