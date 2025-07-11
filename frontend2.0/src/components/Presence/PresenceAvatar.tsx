import React from 'react';
import { PresenceAvatarProps, PresenceStatus, PRESENCE_COLORS } from './types';
import { Avatar } from '../UI';

const PresenceAvatar: React.FC<PresenceAvatarProps> = ({
  userId,
  userName,
  avatar,
  status,
  size = 'md',
  showStatus = true,
  className = ''
}) => {
  const getAvatarSize = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-16 h-16';
      default:
        return 'w-12 h-12';
    }
  };

  const getStatusIndicatorSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const getStatusPosition = () => {
    switch (size) {
      case 'sm':
        return 'bottom-0 right-0';
      case 'lg':
        return 'bottom-1 right-1';
      default:
        return 'bottom-0.5 right-0.5';
    }
  };

  const isAnimated = status === PresenceStatus.ONLINE;

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar
        src={avatar}
        alt={userName}
        className={`${getAvatarSize()} ring-2 ring-white`}
        fallback={userName.substring(0, 2).toUpperCase()}
      />
      
      {showStatus && (
        <div className={`absolute ${getStatusPosition()}`}>
          <div className="relative">
            <div
              className={`
                ${getStatusIndicatorSize()}
                rounded-full
                border-2 border-white
                ${isAnimated ? 'animate-pulse' : ''}
              `}
              style={{ backgroundColor: PRESENCE_COLORS[status] }}
            />
            {isAnimated && (
              <div
                className={`
                  absolute top-0 left-0
                  ${getStatusIndicatorSize()}
                  rounded-full
                  animate-ping
                  opacity-75
                  border-2 border-white
                `}
                style={{ backgroundColor: PRESENCE_COLORS[status] }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresenceAvatar;