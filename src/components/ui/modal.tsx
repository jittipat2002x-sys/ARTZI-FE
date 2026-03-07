import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, LucideIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Base Modal Component ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  wrapperClassName,
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Store current active element
      const activeElement = document.activeElement as HTMLElement;
      return () => {
        document.body.style.overflow = 'unset';
        // Restore focus
        if (activeElement) {
          activeElement.focus();
        }
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-0", wrapperClassName)}>
      <div 
        className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className={cn(
          "relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 w-full sm:max-w-lg animate-in fade-in zoom-in-95 duration-300",
          className
        )}
      >
        {showCloseButton && (
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block z-10">
            <button
              type="button"
              className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

// --- Alert Modal Variation ---

export type AlertType = 'danger' | 'warning' | 'success' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: AlertType;
  loading?: boolean;
  isLoading?: boolean; // For backwards compatibility
  showCancelButton?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'danger',
  loading = false,
  isLoading = false,
  showCancelButton = true,
}: AlertModalProps) {
  const isCurrentlyLoading = loading || isLoading;

  const config = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />,
      bgIcon: 'bg-red-100 dark:bg-red-900/30',
      btnConfirm: 'bg-red-600 hover:bg-red-500 text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
      bgIcon: 'bg-amber-100 dark:bg-amber-900/30',
      btnConfirm: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
      bgIcon: 'bg-blue-100 dark:bg-blue-900/30',
      btnConfirm: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />,
      bgIcon: 'bg-green-100 dark:bg-green-900/30',
      btnConfirm: 'bg-green-600 hover:bg-green-500 text-white',
    },
  };

  const style = config[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="sm:max-w-lg">
      <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div className={cn("mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10", style.bgIcon)}>
            {style.icon}
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="button"
          disabled={isCurrentlyLoading}
          className={cn(
            "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors disabled:opacity-50",
            style.btnConfirm
          )}
          onClick={onConfirm}
        >
          {isCurrentlyLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {confirmText}
        </button>
        {showCancelButton && (
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors disabled:opacity-50"
            disabled={isCurrentlyLoading}
            onClick={onClose}
          >
            {cancelText}
          </button>
        )}
      </div>
    </Modal>
  );
}
