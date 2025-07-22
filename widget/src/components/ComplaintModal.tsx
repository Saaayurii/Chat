import React, { useState } from 'react';
import Modal from './UI/Modal';
import Button from './UI/Button';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  operatorName?: string;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  operatorName = 'оператора'
}) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Непрофессиональное поведение',
    'Грубость или неуважение',
    'Некомпетентность',
    'Медленная реакция',
    'Неправильная информация',
    'Другое'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Пожалуйста, выберите причину жалобы');
      return;
    }

    if (!details.trim()) {
      alert('Пожалуйста, опишите детали жалобы');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason, details);
      handleReset();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Произошла ошибка при отправке жалобы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setReason('');
    setDetails('');
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
      title={`Жалоба на ${operatorName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Причина жалобы *
          </label>
          <div className="space-y-2">
            {reasons.map((reasonOption) => (
              <label
                key={reasonOption}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="reason"
                  value={reasonOption}
                  checked={reason === reasonOption}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{reasonOption}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Детали жалобы *
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Опишите подробно ситуацию, которая вас расстроила..."
            maxLength={1000}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
          <div className="mt-1 text-xs text-gray-500">
            {details.length}/1000
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Обратите внимание
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Жалоба будет рассмотрена администрацией в течение 24 часов. 
                  Ложные жалобы могут повлечь ограничение доступа к сервису.
                </p>
              </div>
            </div>
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
            disabled={!reason.trim() || !details.trim() || isSubmitting}
            className="min-w-[120px]"
            variant="secondary"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить жалобу'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ComplaintModal;