'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

interface AlertProps {
  children: ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  className?: string;
}

export default function Alert({ 
  children, 
  type = 'info', 
  onClose,
  className = '' 
}: AlertProps) {
  const config = {
    success: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-400',
      icon: CheckCircle
    },
    error: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-400',
      icon: AlertCircle
    },
    warning: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-400',
      icon: AlertTriangle
    },
    info: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-400',
      icon: Info
    }
  };

  const { bgColor, textColor, borderColor, icon: Icon } = config[type];
  
  const classes = [
    bgColor,
    textColor,
    borderColor,
    'border px-4 py-3 rounded flex items-start gap-3',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 hover:opacity-70"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}