import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'error':
        return <AlertCircle size={18} color="#f43f5e" />;
      default:
        return <Info size={18} color="#06b6d4" />;
    }
  };

  return (
    <div className={`toast-card glass-panel toast-${toast.type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        <strong className="toast-title">{toast.title}</strong>
        <p className="toast-message">{toast.message}</p>
      </div>
      <button
        className="toast-close-btn"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  );
};
