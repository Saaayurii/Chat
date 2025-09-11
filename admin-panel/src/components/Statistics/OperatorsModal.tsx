'use client';

import { Card } from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import { User as UserType } from '@/types';

interface OperatorsModalProps {
  open: boolean;
  onClose: () => void;
  operators: UserType[];
  onOperatorSelect: (operatorId: string) => void;
  onRoleFilterChange: (role: string) => void;
}

export default ({ 
  open, 
  onClose, 
  operators, 
  onOperatorSelect, 
  onRoleFilterChange 
}: OperatorsModalProps) => 
  open ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-96 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Список операторов
          </h2>
          <Button onClick={onClose} variant="outline" size="sm">
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            {operators.map(operator => (
              <div
                key={operator._id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  onOperatorSelect(operator._id);
                  onRoleFilterChange('operator');
                  onClose();
                }}
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      operator.profile.isOnline ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {operator.profile.fullName || operator.profile.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {operator.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {operator.operatorStats?.totalQuestions || 0} вопросов
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {operator.operatorStats?.averageRating?.toFixed(1) || '0.0'} ★
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  ) : null;