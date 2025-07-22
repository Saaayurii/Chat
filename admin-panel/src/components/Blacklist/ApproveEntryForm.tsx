'use client';

import { useState } from 'react';
import { ApproveBlacklistEntryData } from '@/types';

interface ApproveEntryFormProps {
  loading: boolean;
  onSubmit: (data: ApproveBlacklistEntryData) => Promise<void>;
  onClose: () => void;
}

export default function ApproveEntryForm({ loading, onSubmit, onClose }: ApproveEntryFormProps) {
  const [formData, setFormData] = useState<ApproveBlacklistEntryData>({
    approved: true,
    comments: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ approved: true, comments: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Рассмотреть запись</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Решение</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.approved === true}
                  onChange={() => setFormData({ ...formData, approved: true })}
                  className="mr-2"
                />
                Одобрить запись
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.approved === false}
                  onChange={() => setFormData({ ...formData, approved: false })}
                  className="mr-2"
                />
                Отклонить запись
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Комментарии</label>
            <textarea
              placeholder="Комментарии к решению..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 text-white py-2 rounded disabled:opacity-50 ${
                formData.approved 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? 'Обработка...' : (formData.approved ? 'Одобрить' : 'Отклонить')}
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