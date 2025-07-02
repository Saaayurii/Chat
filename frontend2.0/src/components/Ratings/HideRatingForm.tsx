'use client';

import { useState } from 'react';
import { Rating, HideRatingData } from '@/types';

interface HideRatingFormProps {
  onSubmit: (data: HideRatingData) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export default function HideRatingForm({ onSubmit, onClose, loading }: HideRatingFormProps) {
  const [hideData, setHideData] = useState<HideRatingData>({
    hiddenReason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(hideData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Скрыть оценку</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            placeholder="Причина скрытия оценки..."
            value={hideData.hiddenReason}
            onChange={(e) => setHideData({ ...hideData, hiddenReason: e.target.value })}
            className="w-full border rounded px-3 py-2 h-24"
            required
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Скрытие...' : 'Скрыть оценку'}
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