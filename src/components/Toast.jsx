import { useState, useEffect } from 'react';
import IconifyIcon from '@/components/client-wrapper/IconifyIcon';

let toastListeners = new Set();

export const toast = {
  success(message, duration = 4000) {
    toastListeners.forEach(listener => listener({ type: 'success', message, duration }));
  },
  error(message, duration = 5000) {
    toastListeners.forEach(listener => listener({ type: 'error', message, duration }));
  },
  info(message, duration = 4000) {
    toastListeners.forEach(listener => listener({ type: 'info', message, duration }));
  }
};

export const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (newToast) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { ...newToast, id }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    };

    toastListeners.add(handleNewToast);
    return () => {
      toastListeners.delete(handleNewToast);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
      {toasts.map(t => {
        let bgClass = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200';
        let icon = 'solar:info-circle-bold-duotone';
        let iconColor = 'text-blue-500';

        if (t.type === 'success') {
          bgClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-350';
          icon = 'solar:check-circle-bold-duotone';
          iconColor = 'text-emerald-500';
        } else if (t.type === 'error') {
          bgClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-350';
          icon = 'solar:danger-triangle-bold-duotone';
          iconColor = 'text-rose-500';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-slide-in-up ${bgClass}`}
          >
            <IconifyIcon icon={icon} className={`size-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-semibold leading-relaxed">{t.message}</div>
            <button
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-current opacity-50 hover:opacity-150 shrink-0 transition-opacity"
            >
              <IconifyIcon icon="solar:close-circle-outline" className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
