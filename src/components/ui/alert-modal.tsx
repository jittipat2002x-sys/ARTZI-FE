import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  type = 'danger',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  onConfirm,
  loading = false,
}: AlertModalProps) {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
      bgIcon: 'bg-red-100 dark:bg-red-900/30',
      btnConfirm: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      bgIcon: 'bg-amber-100 dark:bg-amber-900/30',
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      bgIcon: 'bg-blue-100 dark:bg-blue-900/30',
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    success: {
      icon: <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />,
      bgIcon: 'bg-green-100 dark:bg-green-900/30',
      btnConfirm: 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  const style = config[type];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900/95 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-white/10">
        <div className="p-8 pb-6">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-3xl ${style.bgIcon} shrink-0 ring-8 ring-white dark:ring-gray-900 shadow-sm`}>
              {style.icon}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-white/[0.02] flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center shadow-lg shadow-current/20 ${style.btnConfirm}`}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
