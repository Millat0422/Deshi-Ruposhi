import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (type, message, options = {}) => {
      if (!message) return;
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, message, action: options.action }]);
      setTimeout(() => dismiss(id), options.duration || (type === 'error' ? 5000 : 3200));
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, options),
      info: (message, options) => show('info', message, options),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(({ id, type, message, action }) => {
          const Icon = ICONS[type];
          return (
            <div key={id} className={`toast toast--${type}`}>
              <Icon size={18} aria-hidden="true" />
              <span className="toast__message">{message}</span>
              {action && (
                <button
                  type="button"
                  className="toast__action"
                  onClick={() => {
                    action.onClick();
                    dismiss(id);
                  }}
                >
                  {action.label}
                </button>
              )}
              <button type="button" className="toast__close" onClick={() => dismiss(id)} aria-label="Dismiss notification">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
