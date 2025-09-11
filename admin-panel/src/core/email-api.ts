import { api } from './config';
import type { SendEmailData, SendTemplateEmailData } from '@/types';

export var emailAPI = {
  sendEmail: (data: SendEmailData) =>
    api.post('/email/send', data),

  sendTemplateEmail: (data: SendTemplateEmailData) =>
    api.post('/email/send-template', data),

  sendWelcomeEmail: (email: string, username: string) =>
    api.post('/email/welcome', { email, username }),

  sendPasswordResetEmail: (email: string, resetUrl: string) =>
    api.post('/email/password-reset', { email, resetUrl }),

  sendEmailVerification: (email: string, verificationUrl: string) =>
    api.post('/email/email-verification', { email, verificationUrl }),

  sendOperatorAssignedEmail: (email: string, operatorName: string, questionText: string) =>
    api.post('/email/operator-assigned', { email, operatorName, questionText }),

  sendQuestionAnsweredEmail: (email: string, questionText: string, answer: string) =>
    api.post('/email/question-answered', { email, questionText, answer }),

  sendComplaintReceivedEmail: (email: string, complaintId: string) =>
    api.post('/email/complaint-received', { email, complaintId }),

  sendBlacklistNotificationEmail: (email: string, reason: string, duration?: string) =>
    api.post('/email/blacklist-notification', { email, reason, duration }),

  sendRatingRequestEmail: (email: string, operatorName: string, ratingUrl: string) =>
    api.post('/email/rating-request', { email, operatorName, ratingUrl }),
};