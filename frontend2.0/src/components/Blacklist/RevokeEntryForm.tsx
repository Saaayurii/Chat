'use client';

import { useState } from 'react';
import { RevokeBlacklistEntryData } from '@/types';

interface RevokeEntryFormProps {
  loading: boolean;
  onSubmit: (data: RevokeBlacklistEntryData) => Promise<void>;
  onClose: () => void;
}

export default function RevokeEntryForm({ loading, onSubmit, onClose }: RevokeEntryFormProps) {
  const [formData, setFormData] = useState<RevokeBlacklistEntryData>({
    revocationReason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ revocationReason: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Отменить запись в черном списке</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Причина отмены</label>
            <textarea
              placeholder="Причина отмены записи в черном списке..."
              value={formData.revocationReason}
              onChange={(e) => setFormData({ ...formData, revocationReason: e.target.value })}
              className="w-full border rounded px-3 py-2 h-24"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Отмена...' : 'Отменить запись'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Закрыть
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}