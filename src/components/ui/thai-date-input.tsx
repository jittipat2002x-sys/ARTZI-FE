'use client';

import React, { useRef } from 'react';
import { useBranding } from '@/contexts/branding-context';

interface ThaiDateInputProps {
  label?: string;
  required?: boolean;
  value: string; // ISO format: YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function formatThaiDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (!year || !month || !day) return '';
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`;
}

export function ThaiDateInput({
  label,
  required,
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'เลือกวันที่',
}: ThaiDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { brandColor } = useBranding();
  const thaiText = value ? formatThaiDate(value) : placeholder;

  const openPicker = () => {
    if (disabled) return;
    try {
      inputRef.current?.showPicker();
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all outline-none shadow-none flex items-center justify-between cursor-pointer text-left"
        onFocus={e => {
          e.currentTarget.style.borderColor = brandColor;
          e.currentTarget.style.boxShadow = `0 0 0 2px ${brandColor}33`;
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span className={value
          ? 'text-sm text-gray-900 dark:text-white'
          : 'text-sm text-gray-400 dark:text-gray-500'
        }>
          {thaiText}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
      </button>
    </div>
  );
}
