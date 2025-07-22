import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { PresenceStatusSelectorProps, PresenceStatus, PRESENCE_LABELS } from './types';
import PresenceIndicator from './PresenceIndicator';

const PresenceStatusSelector: React.FC<PresenceStatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statuses = [
    PresenceStatus.ONLINE,
    PresenceStatus.AWAY,
    PresenceStatus.BUSY,
    PresenceStatus.INVISIBLE
  ];

  const handleStatusSelect = (status: PresenceStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className={`
          flex items-center gap-2 px-3 py-2 text-sm
          bg-white border border-gray-300 rounded-md shadow-sm
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <PresenceIndicator status={currentStatus} size="sm" />
        <span>{PRESENCE_LABELS[currentStatus]}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="py-1">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                    ${currentStatus === status ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                  `}
                  onClick={() => handleStatusSelect(status)}
                >
                  <PresenceIndicator status={status} size="sm" />
                  <span>{PRESENCE_LABELS[status]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PresenceStatusSelector;