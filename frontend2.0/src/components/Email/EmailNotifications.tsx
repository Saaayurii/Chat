'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

const EmailForm = dynamic(() => import('./EmailForm'), {
  loading: () => <div className="bg-gray-50 p-4 rounded-lg animate-pulse h-64" />
});

const TemplateEmailForm = dynamic(() => import('./TemplateEmailForm'), {
  loading: () => <div className="bg-gray-50 p-4 rounded-lg animate-pulse h-64" />
});

const NotificationForms = dynamic(() => import('./NotificationForms'), {
  loading: () => <div className="bg-gray-50 p-4 rounded-lg animate-pulse h-96" />
});

interface EmailNotificationsProps {
  userRole?: UserRole;
}

export default function EmailNotifications({ userRole }: EmailNotificationsProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'send' | 'template' | 'notifications'>('send');

  const {
    loading,
    error,
    success,
    emailData,
    templateData,
    notificationForms,
    canSendEmails,
    setEmailData,
    setTemplateData,
    setNotificationForms,
    setError,
    setSuccess,
    sendEmail,
    sendTemplateEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail
  } = useEmailNotifications(user?.role);

  if (!canSendEmails) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">У вас нет прав для отправки email уведомлений</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex justify-center p-8">Загрузка...</div>}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Email уведомления</h2>
        </div>

        <div className="border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Отправить Email
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'template' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Шаблонные Email
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Системные уведомления
            </button>
          </nav>
        </div>

        {activeTab === 'send' && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Отправить произвольное email</h3>
            <EmailForm
              emailData={emailData}
              loading={loading}
              onDataChange={setEmailData}
              onSubmit={sendEmail}
            />
          </div>
        )}

        {activeTab === 'template' && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Отправить шаблонное email</h3>
            <TemplateEmailForm
              templateData={templateData}
              loading={loading}
              onDataChange={setTemplateData}
              onSubmit={sendTemplateEmail}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationForms
            forms={notificationForms}
            loading={loading}
            onFormsChange={setNotificationForms}
            onSendWelcome={sendWelcomeEmail}
            onSendPasswordReset={sendPasswordResetEmail}
          />
        )}
      </div>
    </Suspense>
  );
}