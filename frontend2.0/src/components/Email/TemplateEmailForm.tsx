'use client';

import { SendTemplateEmailData } from '@/types';

interface TemplateEmailFormProps {
  templateData: SendTemplateEmailData;
  loading: boolean;
  onDataChange: (data: SendTemplateEmailData) => void;
  onSubmit: (data: SendTemplateEmailData) => Promise<void>;
}

export default function TemplateEmailForm({ 
  templateData, 
  loading, 
  onDataChange, 
  onSubmit 
}: TemplateEmailFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(templateData);
  };

  const handleRecipientsChange = (value: string) => {
    const recipients = value.split(',').map(email => email.trim()).filter(email => email);
    onDataChange({ ...templateData, to: recipients });
  };

  const handleVariableChange = (key: string, value: string) => {
    onDataChange({
      ...templateData,
      variables: { ...templateData.variables, [key]: value }
    });
  };

  const addVariable = () => {
    const key = prompt('Введите название переменной:');
    if (key && key.trim()) {
      handleVariableChange(key.trim(), '');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Получатели (через запятую)</label>
        <input
          type="text"
          placeholder="email1@example.com, email2@example.com"
          value={templateData.to.join(', ')}
          onChange={(e) => handleRecipientsChange(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Шаблон</label>
        <select
          value={templateData.template}
          onChange={(e) => onDataChange({ ...templateData, template: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Выберите шаблон</option>
          <option value="welcome">Приветственное письмо</option>
          <option value="password-reset">Сброс пароля</option>
          <option value="verification">Подтверждение email</option>
          <option value="notification">Уведомление</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Переменные шаблона</label>
          <button
            type="button"
            onClick={addVariable}
            className="text-sm bg-gray-200 px-2 py-1 rounded"
          >
            Добавить переменную
          </button>
        </div>
        
        <div className="space-y-2">
          {Object.entries(templateData.variables).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <input
                type="text"
                value={key}
                disabled
                className="flex-1 border rounded px-3 py-2 bg-gray-50"
              />
              <input
                type="text"
                placeholder="Значение"
                value={value}
                onChange={(e) => handleVariableChange(key, e.target.value)}
                className="flex-2 border rounded px-3 py-2"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Отправка...' : 'Отправить по шаблону'}
      </button>
    </form>
  );
}