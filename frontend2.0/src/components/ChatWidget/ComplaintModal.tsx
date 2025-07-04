"use client";

import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Select } from '../UI/Select';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
  operatorName?: string;
}

const complaintReasons = [
  { value: 'unprofessional_behavior', label: 'Непrofessional поведение' },
  { value: 'rude_treatment', label: 'Грубое обращение' },
  { value: 'incorrect_information', label: 'Неверная информация' },
  { value: 'long_response_time', label: 'Долгое время ответа' },
  { value: 'unresolved_issue', label: 'Нерешенная проблема' },
  { value: 'technical_issues', label: 'Технические проблемы' },
  { value: 'other', label: 'Другое' }
];

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  operatorName = 'Оператор'
}) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!reason || !details.trim()) return;
    onSubmit(reason, details);
    setReason('');
    setDetails('');
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-500" />
            <span>Подать жалобу</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose} className="p-1">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Подать жалобу на оператора {operatorName}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Причина жалобы *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите причину...</option>
                  {complaintReasons.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подробности *
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  placeholder="Опишите подробно суть вашей жалобы..."
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Внимание:</strong> Ваша жалоба будет рассмотрена администрацией. 
              Пожалуйста, указывайте только достоверную информацию.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || !details.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Подать жалобу
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintModal;