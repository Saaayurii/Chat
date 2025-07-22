'use client';

import { SendEmailData } from '@/types';

interface EmailFormProps {
  emailData: SendEmailData;
  loading: boolean;
  onDataChange: (data: SendEmailData) => void;
  onSubmit: (data: SendEmailData) => Promise<void>;
}

export default function EmailForm({ emailData, loading, onDataChange, onSubmit }: EmailFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(emailData);
  };

  const handleRecipientsChange = (value: string) => {
    const recipients = value.split(',').map(email => email.trim()).filter(email => email);
    onDataChange({ ...emailData, to: recipients });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Получатели (через запятую)</label>
        <input
          type="text"
          placeholder="email1@example.com, email2@example.com"
          value={emailData.to.join(', ')}
          onChange={(e) => handleRecipientsChange(e.target.value)}
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
          onChange={(e) => onDataChange({ ...emailData, subject: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Текстовое содержимое</label>
        <textarea
          placeholder="Текст письма..."
          value={emailData.text}
          onChange={(e) => onDataChange({ ...emailData, text: e.target.value })}
          className="w-full border rounded px-3 py-2 h-32"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">HTML содержимое (опционально)</label>
        <textarea
          placeholder="HTML код письма..."
          value={emailData.html}
          onChange={(e) => onDataChange({ ...emailData, html: e.target.value })}
          className="w-full border rounded px-3 py-2 h-32"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Отправка...' : 'Отправить Email'}
      </button>
    </form>
  );
}