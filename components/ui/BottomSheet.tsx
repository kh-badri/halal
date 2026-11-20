'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[90vh]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content: Bottom Sheet on Mobile, Centered Modal Dialog on Desktop */}
      <div
        className={`relative z-10 w-full max-w-md sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border-t-2 border-x-2 sm:border-2 border-ink shadow-2xl flex flex-col ${maxHeight} animate-in slide-in-from-bottom duration-300 pb-safe sm:pb-0`}
      >
        {/* Drag handle (Mobile only) */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing sm:hidden">
          <div className="w-12 h-1.5 bg-ink/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-ink/10">
          <h3 className="text-base font-black text-ink truncate">{title || ''}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-ink/30 text-ink flex items-center justify-center hover:bg-blush transition-colors"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body content */}
        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
