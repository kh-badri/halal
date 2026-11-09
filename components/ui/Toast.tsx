'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, RefreshCw, X } from 'lucide-react';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (optionsOrMessage: ToastOptions | string, type?: 'success' | 'error' | 'info') => void;
  showSaveIndicator: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);

  const showToast = useCallback((optionsOrMessage: ToastOptions | string, type?: 'success' | 'error' | 'info') => {
    const id = Date.now();
    const options: ToastOptions =
      typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage, type: type || 'info' }
        : optionsOrMessage;

    setToast({ ...options, id });

    const dur = options.duration || 3500;
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, dur);
  }, []);

  const showSaveIndicator = useCallback(() => {
    showToast({
      message: 'Perubahan tersimpan otomatis',
      type: 'info',
      duration: 2000,
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSaveIndicator }}>
      {children}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white border-2 border-ink shadow-xl rounded-full px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-ink">
            <div className="flex items-center gap-2.5 truncate">
              {toast.type === 'error' ? (
                <div className="w-5 h-5 rounded-full bg-white border border-ink flex items-center justify-center shrink-0">
                  <AlertCircle size={14} className="text-ink" />
                </div>
              ) : toast.type === 'info' ? (
                <div className="w-5 h-5 rounded-full bg-blush border border-ink flex items-center justify-center shrink-0">
                  <RefreshCw size={12} className="text-ink animate-spin" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-sky border border-ink flex items-center justify-center shrink-0">
                  <Check size={12} className="text-ink stroke-[3]" />
                </div>
              )}
              <span className="truncate font-bold">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-blush border border-ink text-ink rounded-full hover:bg-sky transition-colors"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                onClick={() => setToast(null)}
                className="text-ink/40 hover:text-ink transition-colors"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
