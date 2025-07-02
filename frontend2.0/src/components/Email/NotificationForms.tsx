'use client';

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

interface NotificationFormsProps {
  forms: NotificationForms;
  loading: boolean;
  onFormsChange: (forms: NotificationForms) => void;
  onSendWelcome: (data: { email: string; username: string }) => Promise<void>;
  onSendPasswordReset: (data: { email: string; resetUrl: string }) => Promise<void>;
}

export default function NotificationForms({
  forms,
  loading,
  onFormsChange,
  onSendWelcome,
  onSendPasswordReset
}: NotificationFormsProps) {
  
  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSendWelcome(forms.welcome);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSendPasswordReset(forms.passwordReset);
  };

  const updateForm = <T extends keyof NotificationForms>(
    formName: T,
    data: Partial<NotificationForms[T]>
  ) => {
    onFormsChange({
      ...forms,
      [formName]: { ...forms[formName], ...data }
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Email */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Приветственное письмо</h4>
        <form onSubmit={handleWelcomeSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email получателя"
            value={forms.welcome.email}
            onChange={(e) => updateForm('welcome', { email: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Имя пользователя"
            value={forms.welcome.username}
            onChange={(e) => updateForm('welcome', { username: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить приветственное письмо'}
          </button>
        </form>
      </div>

      {/* Password Reset Email */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Сброс пароля</h4>
        <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email получателя"
            value={forms.passwordReset.email}
            onChange={(e) => updateForm('passwordReset', { email: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="url"
            placeholder="Ссылка для сброса пароля"
            value={forms.passwordReset.resetUrl}
            onChange={(e) => updateForm('passwordReset', { resetUrl: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить письмо сброса пароля'}
          </button>
        </form>
      </div>

      {/* Email Verification */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Подтверждение Email</h4>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email получателя"
            value={forms.emailVerification.email}
            onChange={(e) => updateForm('emailVerification', { email: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="url"
            placeholder="Ссылка для подтверждения"
            value={forms.emailVerification.verificationUrl}
            onChange={(e) => updateForm('emailVerification', { verificationUrl: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="button"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить подтверждение email'}
          </button>
        </div>
      </div>

      {/* Other notification forms can be added here */}
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">
        <p>Другие типы уведомлений (назначение оператора, ответ на вопрос, жалобы и т.д.) 
        могут быть добавлены по мере необходимости.</p>
      </div>
    </div>
  );
}