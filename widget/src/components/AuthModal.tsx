import React, { useState } from 'react';
import Button from './UI/Button';
import Input from './UI/Input';
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, X } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthSuccess?: (token: string, user: any) => void;
  apiUrl: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  apiUrl
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        const userData = {
          id: data.user?._id || data.user?.id,
          _id: data.user?._id || data.user?.id,
          email: data.user?.email,
          role: data.user?.role,
          profile: data.user?.profile || {
            username: data.user?.email?.split('@')[0] || '',
            fullName: data.user?.fullName || '',
            lastSeenAt: new Date(),
            isOnline: true
          },
          createdAt: data.user?.createdAt || new Date(),
          updatedAt: data.user?.updatedAt || new Date()
        };

        onAuthSuccess?.(data.access_token, userData);
        handleClose();
      } else {
        setError(data.message || 'Неверный email или пароль');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.fullName || !registerData.username || !registerData.email || !registerData.password) {
      setError('Заполните все поля');
      return;
    }

    if (registerData.password !== registerData.passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    if (registerData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { passwordConfirm, ...registrationData } = registerData;
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok) {
        setMode('login');
        setLoginData({ email: registerData.email, password: '' });
        alert('Регистрация успешна! Войдите в систему с новыми данными.');
      } else {
        setError(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Ошибка регистрации');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setError('Введите email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setResetEmailSent(true);
      } else {
        setError(data.message || 'Ошибка отправки письма');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('login');
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setResetEmailSent(false);
    setError('');
    setLoginData({ email: '', password: '' });
    setRegisterData({ fullName: '', username: '', email: '', password: '', passwordConfirm: '' });
    setResetEmail('');
    onClose();
  };

  const renderLoginForm = () => (
    <div className="space-y-4">
      

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <Input
            type="email"
            placeholder="m@example.com"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}
      </form>

      <div className="text-center space-y-2">
        <button
          onClick={() => setMode('reset')}
          className="text-sm text-blue-600 hover:text-blue-800"
          type="button"
        >
          Забыли пароль?
        </button>
        <div className="text-sm">
          Нет аккаунта?{" "}
          <button
            onClick={() => setMode('register')}
            className="text-blue-600 hover:text-blue-800"
            type="button"
          >
            Регистрация
          </button>
        </div>
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <div className="space-y-4">
      

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Полное имя</label>
          <Input
            type="text"
            placeholder="Андрей Иванов"
            value={registerData.fullName}
            onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Имя пользователя</label>
          <Input
            type="text"
            placeholder="andrey_123"
            value={registerData.username}
            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            Только латинские буквы, цифры, _ и -, минимум 3 символа
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="MyPassword123!"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              className="pr-10"
              required
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
            Минимум 8 символов
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Повторите пароль</label>
          <div className="relative">
            <Input
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="Повторите пароль"
              value={registerData.passwordConfirm}
              onChange={(e) => setRegisterData({ ...registerData, passwordConfirm: e.target.value })}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}
      </form>

      <div className="text-center">
        <div className="text-sm">
          Уже есть аккаунт?{" "}
          <button
            onClick={() => setMode('login')}
            className="text-blue-600 hover:text-blue-800"
            type="button"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );

  const renderResetForm = () => {
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

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              placeholder="m@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}
        </form>

        <div className="text-center">
          <button
            onClick={() => setMode('login')}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            type="button"
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
      default:
        return 'Вход в систему';
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'register':
        return renderRegistrationForm();
      case 'reset':
        return renderResetForm();
      default:
        return renderLoginForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {getModalTitle()}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;