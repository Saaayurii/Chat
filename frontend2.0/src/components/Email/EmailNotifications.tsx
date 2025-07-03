'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Alert
} from '@/components/UI';

const EmailForm = dynamic(() => import('./EmailForm'), {
  loading: () => <div className="bg-muted/50 p-4 rounded-lg animate-pulse h-64" />
});

const TemplateEmailForm = dynamic(() => import('./TemplateEmailForm'), {
  loading: () => <div className="bg-muted/50 p-4 rounded-lg animate-pulse h-64" />
});

const NotificationForms = dynamic(() => import('./NotificationForms'), {
  loading: () => <div className="bg-muted/50 p-4 rounded-lg animate-pulse h-96" />
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
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground">У вас нет прав для отправки email уведомлений</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="text-muted-foreground">Загрузка...</div></div>}>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Email уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="border-b border-border">
              <nav className="flex space-x-8">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('send')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm rounded-none ${
                    activeTab === 'send' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Отправить Email
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('template')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm rounded-none ${
                    activeTab === 'template' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Шаблонные Email
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('notifications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm rounded-none ${
                    activeTab === 'notifications' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Системные уведомления
                </Button>
              </nav>
            </div>

            {activeTab === 'send' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Отправить произвольное email</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailForm
                    emailData={emailData}
                    loading={loading}
                    onDataChange={setEmailData}
                    onSubmit={sendEmail}
                  />
                </CardContent>
              </Card>
            )}

            {activeTab === 'template' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Отправить шаблонное email</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateEmailForm
                    templateData={templateData}
                    loading={loading}
                    onDataChange={setTemplateData}
                    onSubmit={sendTemplateEmail}
                  />
                </CardContent>
              </Card>
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
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}