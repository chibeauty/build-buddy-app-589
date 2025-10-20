import { toast } from "@/hooks/use-toast";

export const handleApiError = (error: unknown, fallbackMessage = "An unexpected error occurred") => {
  let errorMessage = fallbackMessage;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Check for specific error types
  if (errorMessage.includes('rate limit')) {
    toast({
      title: "Rate Limit Exceeded",
      description: "Please wait a moment before trying again.",
      variant: "destructive",
    });
  } else if (errorMessage.includes('payment required')) {
    toast({
      title: "Payment Required",
      description: "Please add credits to continue using AI features.",
      variant: "destructive",
    });
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    toast({
      title: "Connection Error",
      description: "Please check your internet connection and try again.",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }

  return errorMessage;
};

export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, errorMessage);
    return null;
  }
};
