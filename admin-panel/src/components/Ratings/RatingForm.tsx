'use client';

import { useState } from 'react';
import { CreateRatingData } from '@/types';

interface RatingFormProps {
  operatorId?: string;
  onSubmit: (data: CreateRatingData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export default function RatingForm({ operatorId, onSubmit, onCancel, loading }: RatingFormProps) {
  const [formData, setFormData] = useState<CreateRatingData>({
    operatorId: operatorId || '',
    rating: 5,
    comment: '',
    isAnonymous: false,
    detailedRating: {
      professionalism: 5,
      responseTime: 5,
      helpfulness: 5,
      communication: 5,
      problemResolution: 5
    }
  });

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={`text-xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Оставить оценку оператору</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID оператора</label>
            <input
              type="text"
              placeholder="ID оператора"
              value={formData.operatorId}
              onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Общая оценка</label>
            {renderStars(formData.rating, true, (rating) => 
              setFormData({ ...formData, rating })
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <textarea
              placeholder="Ваш отзыв об операторе..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Детальная оценка:</h4>
            
            <div>
              <label className="block text-sm mb-1">Профессионализм</label>
              {renderStars(formData.detailedRating?.professionalism || 5, true, (rating) =>
                setFormData({
                  ...formData,
                  detailedRating: { ...formData.detailedRating!, professionalism: rating }
                })
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Время ответа</label>
              {renderStars(formData.detailedRating?.responseTime || 5, true, (rating) =>
                setFormData({
                  ...formData,
                  detailedRating: { ...formData.detailedRating!, responseTime: rating }
                })
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Полезность</label>
              {renderStars(formData.detailedRating?.helpfulness || 5, true, (rating) =>
                setFormData({
                  ...formData,
                  detailedRating: { ...formData.detailedRating!, helpfulness: rating }
                })
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Качество общения</label>
              {renderStars(formData.detailedRating?.communication || 5, true, (rating) =>
                setFormData({
                  ...formData,
                  detailedRating: { ...formData.detailedRating!, communication: rating }
                })
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Решение проблем</label>
              {renderStars(formData.detailedRating?.problemResolution || 5, true, (rating) =>
                setFormData({
                  ...formData,
                  detailedRating: { ...formData.detailedRating!, problemResolution: rating }
                })
              )}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            />
            <span>Анонимная оценка</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить оценку'}
            </button>
            <button
              type="button"
              onClick={onCancel}
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