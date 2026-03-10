'use client';

import React, { forwardRef } from 'react';
import { useBranding } from '@/contexts/branding-context';

interface BrandInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'name'> {
  name?: string;
  label?: React.ReactNode;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export const BrandInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, BrandInputProps>(
  ({ label, error, className = '', style, multiline, rows, ...props }, ref) => {
    const { brandColor } = useBranding();

    const commonClassName = `w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition-all outline-none text-gray-900 dark:text-white shadow-none text-sm ${
      error ? '!border-red-500 ring-2 ring-red-500' : ''
    } ${className}`;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!error) {
        e.currentTarget.style.borderColor = brandColor;
        e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}33`;
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!error) {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = 'none';
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        {multiline ? (
          <textarea
            ref={ref as any}
            className={commonClassName}
            style={style}
            rows={rows}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...(props as any)}
          />
        ) : (
          <input
            ref={ref as any}
            className={commonClassName}
            style={style}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...(props as any)}
          />
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

BrandInput.displayName = 'BrandInput';
