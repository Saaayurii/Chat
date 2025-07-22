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
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-colors"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {rating > 0 && (
              <span>
                Выбрано: {rating} из 5 звезд
                {rating === 1 && ' - Очень плохо'}
                {rating === 2 && ' - Плохо'}
                {rating === 3 && ' - Удовлетворительно'}
                {rating === 4 && ' - Хорошо'}
                {rating === 5 && ' - Отлично'}
              </span>
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
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RatingModal;