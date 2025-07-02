'use client';

import { useState } from 'react';
import { emailAPI } from '@/core/api';
import { SendEmailData, SendTemplateEmailData, UserRole } from '@/types';

interface NotificationForms {
  welcome: { email: string; username: string };
  passwordReset: { email: string; resetUrl: string };
  emailVerification: { email: string; verificationUrl: string };
  operatorAssigned: { email: string; operatorName: string; questionText: string };
  questionAnswered: { email: string; questionText: string; answer: string };
  complaintReceived: { email: string; complaintId: string };
  blacklistNotification: { email: string; reason: string; duration: string };
  ratingRequest: { email: string; operatorName: string; ratingUrl: string };
}

export const useEmailNotifications = (userRole?: UserRole) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [emailData, setEmailData] = useState<SendEmailData>({
    to: [],
    subject: '',
    text: '',
    html: ''
  });
  
  const [templateData, setTemplateData] = useState<SendTemplateEmailData>({
    to: [],
    template: '',
    variables: {}
  });
  
  const [notificationForms, setNotificationForms] = useState<NotificationForms>({
    welcome: { email: '', username: '' },
    passwordReset: { email: '', resetUrl: '' },
    emailVerification: { email: '', verificationUrl: '' },
    operatorAssigned: { email: '', operatorName: '', questionText: '' },
    questionAnswered: { email: '', questionText: '', answer: '' },
    complaintReceived: { email: '', complaintId: '' },
    blacklistNotification: { email: '', reason: '', duration: '' },
    ratingRequest: { email: '', operatorName: '', ratingUrl: '' }
  });

  const canSendEmails = userRole === UserRole.ADMIN;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const sendEmail = async (data: SendEmailData) => {
    try {
      setLoading(true);
      clearMessages();
      
      await emailAPI.sendEmail(data);
      setSuccess('Email успешно отправлен');
      setEmailData({
        to: [],
        subject: '',
        text: '',
        html: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendTemplateEmail = async (data: SendTemplateEmailData) => {
    try {
      setLoading(true);
      clearMessages();
      
      await emailAPI.sendTemplateEmail(data);
      setSuccess('Шаблонное email успешно отправлено');
      setTemplateData({
        to: [],
        template: '',
        variables: {}
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке шаблонного email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendWelcomeEmail = async (data: { email: string; username: string }) => {
    try {
      setLoading(true);
      clearMessages();
      
      await emailAPI.sendWelcomeEmail(data);
      setSuccess('Приветственное письмо отправлено');
      setNotificationForms(prev => ({
        ...prev,
        welcome: { email: '', username: '' }
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке приветственного письма');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (data: { email: string; resetUrl: string }) => {
    try {
      setLoading(true);
      clearMessages();
      
      await emailAPI.sendPasswordResetEmail(data);
      setSuccess('Письмо для сброса пароля отправлено');
      setNotificationForms(prev => ({
        ...prev,
        passwordReset: { email: '', resetUrl: '' }
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке письма сброса пароля');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
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
    sendPasswordResetEmail,
    clearMessages
  };
};