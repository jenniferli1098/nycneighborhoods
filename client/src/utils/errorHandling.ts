interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  const err = error as ErrorResponse;
  
  // Check for API error response
  if (err.response?.data?.error) {
    return err.response.data.error;
  }
  
  // Check for standard error message
  if (err.message) {
    return err.message;
  }
  
  // Fallback
  return 'An unexpected error occurred';
};

export const handleFormError = (
  error: unknown,
  setError: (message: string) => void,
  fallbackMessage = 'An error occurred'
): void => {
  const message = getErrorMessage(error);
  setError(message || fallbackMessage);
};