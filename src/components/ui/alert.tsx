'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
  onClose?: () => void;
  action?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { container: string; iconColor: string; icon: React.ElementType }> = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-500',
    icon: CheckCircle2,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    iconColor: 'text-amber-500',
    icon: AlertTriangle,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500',
    icon: AlertCircle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-500',
    icon: Info,
  },
};

export function Alert({
  title,
  children,
  variant = 'info',
  className,
  onClose,
  action,
}: AlertProps) {
  const { container, iconColor, icon: Icon } = variantStyles[variant];

  return (
    <div
      className={cn(
        'relative flex w-full items-start gap-4 rounded-xl border p-4 transition-all duration-200',
        container,
        className
      )}
    >
      <div className={cn('flex-shrink-0 pt-0.5', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm leading-relaxed opacity-90">
        {title && <h5 className="mb-1 font-bold">{title}</h5>}
        {children}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
