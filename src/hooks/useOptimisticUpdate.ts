import { useState, useCallback } from 'react';

interface UseOptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useOptimisticUpdate = <T>(
  initialData: T,
  options?: UseOptimisticUpdateOptions<T>
) => {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateOptimistically = useCallback(
    async (
      optimisticValue: T,
      updateFn: () => Promise<T>
    ) => {
      const previousData = data;
      setData(optimisticValue);
      setIsLoading(true);
      setError(null);

      try {
        const result = await updateFn();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        setData(previousData);
        const error = err instanceof Error ? err : new Error('Update failed');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [data, options]
  );

  return {
    data,
    isLoading,
    error,
    updateOptimistically,
    setData,
  };
};
