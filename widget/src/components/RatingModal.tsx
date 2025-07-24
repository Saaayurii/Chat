import React, { useState } from 'react';
import { Star } from 'lucide-react';
import Modal from './UI/Modal';
import Button from './UI/Button';
import Input from './UI/Input';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  operatorName?: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  operatorName = 'оператора'
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Пожалуйста, выберите оценку');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment);
      handleReset();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Произошла ошибка при отправке оценки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Оценить работу ${operatorName}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ваша оценка
          </label>
          <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-yellow-50 to-orange-50/50 rounded-xl border border-yellow-200/50 shadow-sm">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2 rounded-full hover:bg-yellow-50 transition-all duration-200 transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-500 fill-current drop-shadow-sm'
                      : 'text-gray-300 hover:text-gray-400'
                  } transition-all duration-200`}
                />
              </button>
            ))}
          </div>
          <div className="mt-3 text-center">
            {rating > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200/50">
                <span className="text-sm font-semibold text-gray-700">
                  ⭐ Выбрано: {rating} из 5 звезд
                </span>
                <div className="text-sm text-gray-600 mt-1">
                  {rating === 1 && '😞 Очень плохо'}
                  {rating === 2 && '😕 Плохо'}
                  {rating === 3 && '😐 Удовлетворительно'}
                  {rating === 4 && '😊 Хорошо'}
                  {rating === 5 && '🤩 Отлично'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <Input
            label="Комментарий (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Поделитесь своими впечатлениями..."
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500">
            {comment.length}/500
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="min-w-[120px] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? '📝 Отправка...' : '⭐ Отправить оценку'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RatingModal;