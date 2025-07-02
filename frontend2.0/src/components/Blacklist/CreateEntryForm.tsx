'use client';

import { useState } from 'react';
import { CreateBlacklistEntryData, BlacklistReason, BlacklistType } from '@/types';

interface CreateEntryFormProps {
  loading: boolean;
  onSubmit: (data: CreateBlacklistEntryData) => Promise<void>;
  onClose: () => void;
}

export default function CreateEntryForm({ loading, onSubmit, onClose }: CreateEntryFormProps) {
  const [formData, setFormData] = useState<CreateBlacklistEntryData>({
    userId: '',
    reason: BlacklistReason.SPAM,
    description: '',
    type: BlacklistType.TEMPORARY,
    severity: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      userId: '',
      reason: BlacklistReason.SPAM,
      description: '',
      type: BlacklistType.TEMPORARY,
      severity: 1
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Добавить в черный список</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID пользователя</label>
            <input
              type="text"
              placeholder="ID пользователя"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Причина</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as BlacklistReason })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value={BlacklistReason.SPAM}>Спам</option>
              <option value={BlacklistReason.ABUSE}>Оскорбления</option>
              <option value={BlacklistReason.INAPPROPRIATE_CONTENT}>Неподходящий контент</option>
              <option value={BlacklistReason.VIOLATION_OF_TERMS}>Нарушение правил</option>
              <option value={BlacklistReason.FRAUD}>Мошенничество</option>
              <option value={BlacklistReason.OTHER}>Другое</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              placeholder="Подробное описание нарушения..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded px-3 py-2 h-24"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип блокировки</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as BlacklistType })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value={BlacklistType.TEMPORARY}>Временная</option>
              <option value={BlacklistType.PERMANENT}>Постоянная</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Серьезность (1-5)</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value={1}>1 - Минимальная</option>
              <option value={2}>2 - Низкая</option>
              <option value={3}>3 - Средняя</option>
              <option value={4}>4 - Высокая</option>
              <option value={5}>5 - Критическая</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Добавить в черный список'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}