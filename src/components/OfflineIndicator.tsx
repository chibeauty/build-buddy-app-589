import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 border-warning bg-warning/10">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may not be available.
      </AlertDescription>
    </Alert>
  );
};
