'use client';

import React, { forwardRef } from 'react';
import { useBranding } from '@/contexts/branding-context';

interface BrandTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  name?: string;
  label?: React.ReactNode;
  error?: string;
}

export const BrandTextarea = forwardRef<HTMLTextAreaElement, BrandTextareaProps>(
  ({ label, error, className = '', style, rows = 3, ...props }, ref) => {
    const { brandColor } = useBranding();

    return (
      <div className="w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition-all outline-none text-gray-900 dark:text-white shadow-none text-sm resize-none cursor-text ${
            error ? '!border-red-500 ring-2 ring-red-500' : ''
          } ${className}`}
          style={style}
          onFocus={e => {
            if (!error) {
              e.currentTarget.style.borderColor = brandColor;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}33`;
            }
          }}
          onBlur={e => {
            if (!error) {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

BrandTextarea.displayName = 'BrandTextarea';
