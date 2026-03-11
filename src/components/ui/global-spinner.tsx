'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useBranding } from '@/contexts/branding-context';

export function GlobalSpinner() {
  const [requestCount, setRequestCount] = useState(0);
  const { brandColor } = useBranding();

  useEffect(() => {
    const handleStart = () => {
      setRequestCount(prev => prev + 1);
    };

    const handleEnd = () => {
      setRequestCount(prev => Math.max(0, prev - 1));
    };

    window.addEventListener('api:start', handleStart);
    window.addEventListener('api:end', handleEnd);

    return () => {
      window.removeEventListener('api:start', handleStart);
      window.removeEventListener('api:end', handleEnd);
    };
  }, []);

  if (requestCount === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          กำลังโหลด...
        </span>
      </div>
    </div>
  );
}
