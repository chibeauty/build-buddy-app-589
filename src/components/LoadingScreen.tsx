import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading ExHub...</p>
      </div>
    </div>
  );
};
