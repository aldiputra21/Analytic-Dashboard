import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { commonsI18n } from '../i18n/commons';
import { useAuth } from '../hooks/financial/useAuth';

export function useNetworkResilience() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { language } = useAuth();
  const t = commonsI18n[language];

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(t.networkOnline, {
        icon: '🌐',
        id: 'network-status',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error(t.networkOffline, {
        icon: '📡',
        id: 'network-status',
        duration: Infinity, // Keep it visible until online
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t.networkOnline, t.networkOffline]);

  return { isOnline };
}
