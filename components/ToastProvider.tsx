import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ReactDOM from 'react-dom';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ICONS: Record<ToastType, ReactNode> = {
    error: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const TOAST_STYLES: Record<ToastType, { bg: string; text: string; icon: string }> = {
    error: { bg: 'bg-red-500 dark:bg-red-800/90', text: 'text-white dark:text-red-100', icon: 'text-white dark:text-red-100' },
    success: { bg: 'bg-green-500 dark:bg-green-800/90', text: 'text-white dark:text-green-100', icon: 'text-white dark:text-green-100' },
    info: { bg: 'bg-blue-500 dark:bg-blue-800/90', text: 'text-white dark:text-blue-100', icon: 'text-white dark:text-blue-100' },
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
    return ReactDOM.createPortal(
        <div className="fixed top-5 right-5 z-[100] space-y-2 w-full max-w-sm">
            {toasts.map((toast) => {
                 const styles = TOAST_STYLES[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`flex items-center p-4 rounded-lg shadow-2xl backdrop-blur-sm animate-fade-in-right ${styles.bg} ${styles.text}`}
                    >
                         <div className={`flex-shrink-0 mr-3 ${styles.icon}`}>{ICONS[toast.type]}</div>
                        <span className="flex-grow">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-4 p-1 rounded-full hover:bg-black/20 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                );
            })}
        </div>,
        document.body
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
      const id = Date.now();
      setToasts((currentToasts) => [...currentToasts, { id, message, type }]);

      setTimeout(() => {
          removeToast(id);
      }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
