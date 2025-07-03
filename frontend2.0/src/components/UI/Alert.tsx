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
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle
    },
    error: {
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertCircle
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-200 dark:border-blue-800',
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
          className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}