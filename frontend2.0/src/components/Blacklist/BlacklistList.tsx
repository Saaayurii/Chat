'use client';

import { BlacklistEntry, BlacklistStatus, UserRole } from '@/types';

interface BlacklistListProps {
  entries: BlacklistEntry[];
  userRole?: UserRole;
  onApprove?: (entry: BlacklistEntry) => void;
  onRevoke?: (entry: BlacklistEntry) => void;
}

export default function BlacklistList({ 
  entries, 
  userRole, 
  onApprove, 
  onRevoke 
}: BlacklistListProps) {
  const canManageBlacklist = userRole === UserRole.ADMIN;

  const getStatusColor = (status: BlacklistStatus) => {
    switch (status) {
      case BlacklistStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BlacklistStatus.APPROVED:
        return 'bg-red-100 text-red-800';
      case BlacklistStatus.REJECTED:
        return 'bg-gray-100 text-gray-800';
      case BlacklistStatus.REVOKED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BlacklistStatus) => {
    switch (status) {
      case BlacklistStatus.PENDING:
        return 'Ожидает рассмотрения';
      case BlacklistStatus.APPROVED:
        return 'Одобрена';
      case BlacklistStatus.REJECTED:
        return 'Отклонена';
      case BlacklistStatus.REVOKED:
        return 'Отменена';
      default:
        return status;
    }
  };

  const getReasonText = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'SPAM': 'Спам',
      'ABUSE': 'Оскорбления',
      'INAPPROPRIATE_CONTENT': 'Неподходящий контент',
      'VIOLATION_OF_TERMS': 'Нарушение правил',
      'FRAUD': 'Мошенничество',
      'OTHER': 'Другое'
    };
    return reasonMap[reason] || reason;
  };

  const getTypeText = (type: string) => {
    return type === 'TEMPORARY' ? 'Временная' : 'Постоянная';
  };

  const getUserDisplayName = (userId: string | any): string => {
    if (typeof userId === 'string') {
      return userId;
    }
    if (userId && typeof userId === 'object') {
      return userId.profile?.fullName || userId.email || userId.profile?.username || 'Неизвестный пользователь';
    }
    return 'Неизвестный пользователь';
  };

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">
                  Пользователь: {getUserDisplayName(entry.userId)}
                </h3>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(entry.status)}`}>
                  {getStatusText(entry.status)}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {getTypeText(entry.type)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <p><strong>Причина:</strong> {getReasonText(entry.reason)}</p>
                <p><strong>Описание:</strong> {entry.description}</p>
                <p><strong>Серьезность:</strong> {entry.severity}/5</p>
              </div>

              {entry.comments && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium text-gray-800">Комментарии:</p>
                  <p className="text-gray-700">{entry.comments}</p>
                </div>
              )}

              {entry.revocationReason && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                  <p className="font-medium text-green-800">Причина отмены:</p>
                  <p className="text-green-700">{entry.revocationReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-3">
            <p>Создана: {new Date(entry.createdAt).toLocaleString()}</p>
            {entry.approvedAt && (
              <p>Одобрена: {new Date(entry.approvedAt).toLocaleString()}</p>
            )}
            {entry.revokedAt && (
              <p>Отменена: {new Date(entry.revokedAt).toLocaleString()}</p>
            )}
          </div>

          {canManageBlacklist && (
            <div className="flex gap-2">
              {entry.status === BlacklistStatus.PENDING && onApprove && (
                <button
                  onClick={() => onApprove(entry)}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  Одобрить
                </button>
              )}
              
              {entry.status === BlacklistStatus.APPROVED && onRevoke && (
                <button
                  onClick={() => onRevoke(entry)}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                >
                  Отменить
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}