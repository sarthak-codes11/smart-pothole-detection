import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useSystem();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const borderClass =
          toast.type === 'danger'
            ? 'border-rose-500/30 bg-slate-900/95 text-rose-300'
            : toast.type === 'warning'
            ? 'border-amber-500/30 bg-slate-900/95 text-amber-300'
            : toast.type === 'success'
            ? 'border-emerald-500/30 bg-slate-900/95 text-emerald-300'
            : 'border-slate-700 bg-slate-900/95 text-cyan-300';

        const Icon =
          toast.type === 'danger'
            ? AlertCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : toast.type === 'success'
            ? CheckCircle
            : Info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border shadow-xl backdrop-blur-sm transition-all ${borderClass}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200 truncate">{toast.title}</span>
                <span className="text-[10px] text-slate-500 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
