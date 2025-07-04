"use client";

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  operatorName?: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  operatorName = 'Оператор'
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
    setRating(0);
    setComment('');
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Оценить работу оператора</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Оцените качество обслуживания оператора {operatorName}
            </p>
            
            <div className="flex justify-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => handleRatingHover(star)}
                  onMouseLeave={handleRatingLeave}
                  className="p-1 transition-colors hover:bg-gray-100 rounded"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-500">
              {rating === 0 && 'Выберите оценку'}
              {rating === 1 && 'Очень плохо'}
              {rating === 2 && 'Плохо'}
              {rating === 3 && 'Нормально'}
              {rating === 4 && 'Хорошо'}
              {rating === 5 && 'Отлично'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий (необязательно)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Оставьте ваш отзыв о работе оператора..."
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              Отправить оценку
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingModal;