'use client';

import { useState } from 'react';
import { emailAPI } from '@/core/api';
import { 
  SendEmailData,
  SendTemplateEmailData,
  UserRole 
} from '@/types';
import { useAuthStore } from '@/store/authStore';

interface EmailNotificationsProps {
  userRole?: UserRole;
}

export default function EmailNotifications({ userRole }: EmailNotificationsProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'send' | 'template' | 'notifications'>('send');
  
  // Send email form
  const [emailData, setEmailData] = useState<SendEmailData>({
    to: [],
    subject: '',
    text: '',
    html: ''
  });
  
  // Template email form
  const [templateData, setTemplateData] = useState<SendTemplateEmailData>({
    to: [],
    template: '',
    variables: {}
  });
  
  // Notification forms
  const [notificationForms, setNotificationForms] = useState({
    welcome: { email: '', username: '' },
    passwordReset: { email: '', resetUrl: '' },
    emailVerification: { email: '', verificationUrl: '' },
    operatorAssigned: { email: '', operatorName: '', questionText: '' },
    questionAnswered: { email: '', questionText: '', answer: '' },
    complaintReceived: { email: '', complaintId: '' },
    blacklistNotification: { email: '', reason: '', duration: '' },
    ratingRequest: { email: '', operatorName: '', ratingUrl: '' }
  });

  const canSendEmails = user?.role === UserRole.ADMIN;

  if (!canSendEmails) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">У вас нет прав для отправки email уведомлений</p>
      </div>
    );
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await emailAPI.sendEmail(emailData);
      setSuccess('Email успешно отправлен');
      setEmailData({
        to: [],
        subject: '',
        text: '',
        html: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await emailAPI.sendTemplateEmail(templateData);
      setSuccess('Шаблонное email успешно отправлено');
      setTemplateData({
        to: [],
        template: '',
        variables: {}
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке шаблонного email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (type: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      switch (type) {
        case 'welcome':
          await emailAPI.sendWelcomeEmail(data.email, data.username);
          break;
        case 'passwordReset':
          await emailAPI.sendPasswordResetEmail(data.email, data.resetUrl);
          break;
        case 'emailVerification':
          await emailAPI.sendEmailVerification(data.email, data.verificationUrl);
          break;
        case 'operatorAssigned':
          await emailAPI.sendOperatorAssignedEmail(data.email, data.operatorName, data.questionText);
          break;
        case 'questionAnswered':
          await emailAPI.sendQuestionAnsweredEmail(data.email, data.questionText, data.answer);
          break;
        case 'complaintReceived':
          await emailAPI.sendComplaintReceivedEmail(data.email, data.complaintId);
          break;
        case 'blacklistNotification':
          await emailAPI.sendBlacklistNotificationEmail(data.email, data.reason, data.duration);
          break;
        case 'ratingRequest':
          await emailAPI.sendRatingRequestEmail(data.email, data.operatorName, data.ratingUrl);
          break;
      }
      
      setSuccess('Уведомление успешно отправлено');
      setNotificationForms({
        ...notificationForms,
        [type]: Object.keys(notificationForms[type as keyof typeof notificationForms]).reduce((acc, key) => {
          acc[key] = '';
          return acc;
        }, {} as any)
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке уведомления');
    } finally {
      setLoading(false);
    }
  };

  const parseEmailList = (emailString: string): string[] => {
    return emailString.split(',').map(email => email.trim()).filter(email => email.length > 0);
  };

  const parseVariables = (variablesString: string): Record<string, any> => {
    try {
      return JSON.parse(variablesString || '{}');
    } catch {
      return {};
    }
  };

  return (
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email уведомления</h2>
      </div>

      {/* Tabs */}
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

      {/* Send Email Tab */}
      {activeTab === 'send' && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Отправить произвольное email</h3>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Получатели (через запятую)</label>
              <input
                type="text"
                placeholder="user1@example.com, user2@example.com"
                value={emailData.to.join(', ')}
                onChange={(e) => setEmailData({ ...emailData, to: parseEmailList(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Тема</label>
              <input
                type="text"
                placeholder="Тема письма"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Текст (обычный)</label>
              <textarea
                placeholder="Текст письма..."
                value={emailData.text}
                onChange={(e) => setEmailData({ ...emailData, text: e.target.value })}
                className="w-full border rounded px-3 py-2 h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">HTML (необязательно)</label>
              <textarea
                placeholder="HTML содержимое..."
                value={emailData.html}
                onChange={(e) => setEmailData({ ...emailData, html: e.target.value })}
                className="w-full border rounded px-3 py-2 h-32"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        </div>
      )}

      {/* Template Email Tab */}
      {activeTab === 'template' && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Отправить шаблонное email</h3>
          <form onSubmit={handleSendTemplateEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Получатели (через запятую)</label>
              <input
                type="text"
                placeholder="user1@example.com, user2@example.com"
                value={templateData.to.join(', ')}
                onChange={(e) => setTemplateData({ ...templateData, to: parseEmailList(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Шаблон</label>
              <input
                type="text"
                placeholder="Название шаблона"
                value={templateData.template}
                onChange={(e) => setTemplateData({ ...templateData, template: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Переменные (JSON)</label>
              <textarea
                placeholder='{"name": "Иван", "company": "Моя компания"}'
                value={JSON.stringify(templateData.variables, null, 2)}
                onChange={(e) => setTemplateData({ ...templateData, variables: parseVariables(e.target.value) })}
                className="w-full border rounded px-3 py-2 h-32"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить шаблон'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Welcome Email */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Приветственное письмо</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="email"
                placeholder="Email пользователя"
                value={notificationForms.welcome.email}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  welcome: { ...notificationForms.welcome, email: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Имя пользователя"
                value={notificationForms.welcome.username}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  welcome: { ...notificationForms.welcome, username: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => handleSendNotification('welcome', notificationForms.welcome)}
                disabled={loading || !notificationForms.welcome.email || !notificationForms.welcome.username}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>

          {/* Password Reset Email */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Сброс пароля</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="email"
                placeholder="Email пользователя"
                value={notificationForms.passwordReset.email}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  passwordReset: { ...notificationForms.passwordReset, email: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="url"
                placeholder="Ссылка для сброса"
                value={notificationForms.passwordReset.resetUrl}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  passwordReset: { ...notificationForms.passwordReset, resetUrl: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => handleSendNotification('passwordReset', notificationForms.passwordReset)}
                disabled={loading || !notificationForms.passwordReset.email || !notificationForms.passwordReset.resetUrl}
                className="bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>

          {/* Operator Assigned Email */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Назначение оператора</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email посетителя"
                value={notificationForms.operatorAssigned.email}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  operatorAssigned: { ...notificationForms.operatorAssigned, email: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Имя оператора"
                value={notificationForms.operatorAssigned.operatorName}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  operatorAssigned: { ...notificationForms.operatorAssigned, operatorName: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Текст вопроса"
                value={notificationForms.operatorAssigned.questionText}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  operatorAssigned: { ...notificationForms.operatorAssigned, questionText: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => handleSendNotification('operatorAssigned', notificationForms.operatorAssigned)}
                disabled={loading || !notificationForms.operatorAssigned.email || !notificationForms.operatorAssigned.operatorName}
                className="bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>

          {/* Blacklist Notification */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Уведомление о блокировке</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email пользователя"
                value={notificationForms.blacklistNotification.email}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  blacklistNotification: { ...notificationForms.blacklistNotification, email: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Причина блокировки"
                value={notificationForms.blacklistNotification.reason}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  blacklistNotification: { ...notificationForms.blacklistNotification, reason: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Длительность (необязательно)"
                value={notificationForms.blacklistNotification.duration}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  blacklistNotification: { ...notificationForms.blacklistNotification, duration: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => handleSendNotification('blacklistNotification', notificationForms.blacklistNotification)}
                disabled={loading || !notificationForms.blacklistNotification.email || !notificationForms.blacklistNotification.reason}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>

          {/* Rating Request */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-medium mb-3">Запрос оценки</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email посетителя"
                value={notificationForms.ratingRequest.email}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  ratingRequest: { ...notificationForms.ratingRequest, email: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Имя оператора"
                value={notificationForms.ratingRequest.operatorName}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  ratingRequest: { ...notificationForms.ratingRequest, operatorName: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="url"
                placeholder="Ссылка для оценки"
                value={notificationForms.ratingRequest.ratingUrl}
                onChange={(e) => setNotificationForms({
                  ...notificationForms,
                  ratingRequest: { ...notificationForms.ratingRequest, ratingUrl: e.target.value }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => handleSendNotification('ratingRequest', notificationForms.ratingRequest)}
                disabled={loading || !notificationForms.ratingRequest.email || !notificationForms.ratingRequest.operatorName}
                className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}