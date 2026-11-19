import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function SweetAlertModal({
  isOpen,
  onClose,
  title = 'Attention',
  message = '',
  type = 'warning',
  confirmText = 'OK',
}) {
  useEffect(() => {
    if (!isOpen) return;
    const origBody = document.body.style.overflow;
    const origHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBody;
      document.documentElement.style.overflow = origHtml;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none overscroll-contain"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Close Cross in Corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Icon Badge */}
        <div
          className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-4 animate-bounce ${
            type === 'warning'
              ? 'bg-amber-50 border-amber-100 text-amber-500'
              : type === 'error'
              ? 'bg-rose-50 border-rose-100 text-rose-500'
              : type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-500'
              : 'bg-sky-50 border-sky-100 text-[#00a8e7]'
          }`}
          style={{ animationDuration: '2s' }}
        >
          {type === 'success' ? (
            <CheckCircle className="w-8 h-8 stroke-[2.2]" />
          ) : type === 'info' ? (
            <Info className="w-8 h-8 stroke-[2.2]" />
          ) : (
            <AlertCircle className="w-8 h-8 stroke-[2.2]" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-600 font-medium mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00a8e7] via-[#2672e5] to-[#5236df] hover:from-[#0097cf] hover:to-[#4428cb] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-[#00a8e7]/25 hover:shadow-xl hover:shadow-[#5236df]/35 active:scale-[0.98] transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#00a8e7]/40"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}

