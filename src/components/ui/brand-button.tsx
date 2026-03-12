'use client';

import React from 'react';
import { useBranding } from '@/contexts/branding-context';
import { cn } from '@/lib/utils';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function BrandButton({ 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className, 
  style,
  children, 
  ...props 
}: BrandButtonProps) {
  const { brandColor } = useBranding();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-md',
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const buttonContent = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  if (variant === 'primary') {
    return (
      <button
        className={cn(baseClasses, sizeClasses[size], 'text-white hover:opacity-90', className)}
        style={{ backgroundColor: brandColor, ...style }}
        disabled={loading || props.disabled}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        className={cn(baseClasses, sizeClasses[size], 'border-2 hover:opacity-80', className)}
        style={{ borderColor: brandColor, color: brandColor, ...style }}
        disabled={loading || props.disabled}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  // ghost
  return (
    <button
      className={cn(baseClasses, sizeClasses[size], 'hover:opacity-80', className)}
      style={{ color: brandColor, backgroundColor: brandColor + '15', ...style }}
      disabled={loading || props.disabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
}

// Badge component that uses brand color
export function BrandBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  const { brandColor } = useBranding();
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', className)}
      style={{ backgroundColor: brandColor + '15', color: brandColor }}
    >
      {children}
    </span>
  );
}
