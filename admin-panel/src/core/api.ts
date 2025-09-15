export { api } from './config';
export { authAPI } from './auth-api';
export { usersAPI, profileAPI } from './users-api';

// Экспорт типов
export type { LoginData, RegistrationData, ResetPasswordData, ForgotPasswordData } from '../types/auth';
export type { CreateUserData, UpdateUserData, UpdateProfileData } from '../types/user';
export { chatAPI } from './chat-api';
export { questionsAPI } from './questions-api';
export { complaintsAPI } from './complaints-api';
export { blacklistAPI } from './blacklist-api';
export { ratingsAPI } from './ratings-api';
export { emailAPI } from './email-api';
export { statisticsAPI } from './statistics-api';
export { transferAPI } from './transfer-api';

export default { 
  auth: () => import('./auth-api').then(m => m.authAPI),
  users: () => import('./users-api').then(m => m.usersAPI),
  profile: () => import('./users-api').then(m => m.profileAPI),
  chat: () => import('./chat-api').then(m => m.chatAPI),
  questions: () => import('./questions-api').then(m => m.questionsAPI),
  complaints: () => import('./complaints-api').then(m => m.complaintsAPI),
  blacklist: () => import('./blacklist-api').then(m => m.blacklistAPI),
  ratings: () => import('./ratings-api').then(m => m.ratingsAPI),
  email: () => import('./email-api').then(m => m.emailAPI),
  statistics: () => import('./statistics-api').then(m => m.statisticsAPI),
  transfer: () => import('./transfer-api').then(m => m.transferAPI),
};