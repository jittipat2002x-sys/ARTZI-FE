'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { useBranding } from '@/contexts/branding-context';

interface Option {
  id: string;
  name: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  multiple?: boolean;
  icon?: React.ElementType;
  className?: string;
  error?: string;
  onSearch?: (term: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'เลือก...',
  searchPlaceholder = 'ค้นหา...',
  loading = false,
  multiple = false,
  icon: Icon,
  className = '',
  error = '',
  onSearch,
  onLoadMore,
  hasMore = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { brandColor } = useBranding();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) onSearch(term);
  };

  const isSelected = (id: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(id);
    }
    return value === id;
  };

  const handleSelect = (id: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(id)) {
        onChange(currentValues.filter(v => v !== id));
      } else {
        onChange([...currentValues, id]);
      }
    } else {
      onChange(id);
      setIsOpen(false);
    }
  };

  const selectedOptions = options.filter(opt => isSelected(opt.id));
  const displayedLabel = multiple 
    ? selectedOptions.length > 0 
      ? `${selectedOptions.length} รายการ`
      : placeholder
    : selectedOptions[0]?.name || placeholder;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
          isOpen
            ? 'bg-white dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        } ${error ? 'border-red-500 ring-red-500/10' : ''} ${
          !multiple && selectedOptions.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        }`}
        style={isOpen ? { borderColor: brandColor, boxShadow: `0 0 0 2px ${brandColor}1A` } : {}}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
          <span className="truncate">{displayedLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {multiple && selectedOptions.length > 0 && (
            <span 
              className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] text-white rounded-full"
              style={{ backgroundColor: brandColor }}
            >
              {selectedOptions.length}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none dark:text-gray-100 placeholder:text-gray-400 transition-colors"
                onFocus={e => (e.currentTarget.style.borderColor = brandColor)}
                onBlur={e => (e.currentTarget.style.borderColor = '')}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {options.map((opt) => {
              const selected = isSelected(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                    selected
                      ? 'font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  style={selected ? { backgroundColor: `${brandColor}0D`, color: brandColor } : {}}
                >
                  <span className="truncate">{opt.name}</span>
                  {selected && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              );
            })}

            {loading && (
              <div className="px-4 py-3 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: brandColor }} />
              </div>
            )}

            {!loading && options.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">ไม่พบผลลัพธ์</p>
            )}

            {hasMore && !loading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadMore?.();
                }}
                className="w-full py-2 text-xs font-medium hover:underline"
                style={{ color: brandColor }}
              >
                โหลดเพิ่มเติม...
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500 px-1">{error}</p>}
    </div>
  );
}
