import React from 'react';
import { PresenceIndicatorProps, PresenceStatus, PRESENCE_COLORS, PRESENCE_LABELS } from './types';

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  size = 'md',
  showText = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const isAnimated = status === PresenceStatus.ONLINE;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="relative">
        <div
          className={`
            ${getSizeClasses()}
            rounded-full
            border border-white
            ${isAnimated ? 'animate-pulse' : ''}
          `}
          style={{ backgroundColor: PRESENCE_COLORS[status] }}
        />
        {isAnimated && (
          <div
            className={`
              absolute top-0 left-0
              ${getSizeClasses()}
              rounded-full
              animate-ping
              opacity-75
            `}
            style={{ backgroundColor: PRESENCE_COLORS[status] }}
          />
        )}
      </div>
      
      {showText && (
        <span className={`${getTextSizeClass()} text-gray-700 font-medium`}>
          {PRESENCE_LABELS[status]}
        </span>
      )}
    </div>
  );
};

export default PresenceIndicator;