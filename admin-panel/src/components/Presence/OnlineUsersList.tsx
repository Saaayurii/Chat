import React from 'react';
import { OnlineUsersListProps, PresenceStatus } from './types';
import PresenceAvatar from './PresenceAvatar';
import PresenceIndicator from './PresenceIndicator';

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  users,
  maxVisible = 10,
  onUserClick,
  className = ''
}) => {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);

  const formatLastSeen = (lastSeen: number) => {
    const now = Date.now();
    const diff = now - lastSeen;
    
    if (diff < 60000) { // меньше минуты
      return 'сейчас';
    } else if (diff < 3600000) { // меньше часа
      const minutes = Math.floor(diff / 60000);
      return `${minutes} мин назад`;
    } else if (diff < 86400000) { // меньше дня
      const hours = Math.floor(diff / 3600000);
      return `${hours} ч назад`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days} д назад`;
    }
  };

  const getActivityText = (user: any) => {
    if (user.status === PresenceStatus.ONLINE && user.activity) {
      return user.activity;
    }
    return formatLastSeen(user.lastSeen);
  };

  if (users.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <p className="text-sm">Нет пользователей онлайн</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          Онлайн ({users.length})
        </h3>
      </div>
      
      <div className="space-y-1">
        {visibleUsers.map((user) => (
          <div
            key={user.userId}
            className={`
              flex items-center gap-3 p-2 rounded-lg
              ${onUserClick ? 'hover:bg-gray-100 cursor-pointer' : ''}
              transition-colors duration-150
            `}
            onClick={() => onUserClick?.(user.userId)}
          >
            <PresenceAvatar
              userId={user.userId}
              userName={user.userId} // В реальном приложении здесь должно быть имя пользователя
              status={user.status}
              size="sm"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.userId} {/* В реальном приложении здесь должно быть имя */}
                </p>
                <PresenceIndicator status={user.status} size="sm" />
              </div>
              
              <div className="flex items-center gap-2 mt-0.5">
                {user.deviceType && (
                  <span className="text-xs text-gray-500 capitalize">
                    {user.deviceType}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {getActivityText(user)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {hiddenCount > 0 && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            и еще {hiddenCount} пользователей
          </p>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;