'use client';

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variantClasses = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-200',
    info: 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 py-1 text-sm'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  ].join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}