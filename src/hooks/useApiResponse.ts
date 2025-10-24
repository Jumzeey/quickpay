import { useCallback } from 'react';
import { notifyError, notifySuccess } from '@/util/utils';

interface ApiError {
  message?: string;
  payload?: Record<string, any>;
  response?: {
    data?: {
      errors?: Record<string, any>;
      message?: string;
    };
  };
}

/**
 * Hook for handling API responses with consistent error and success messaging
 * Automatically formats validation errors from API responses
 */
export function useApiResponse() {
  /**
   * Handle API errors with proper formatting for validation errors
   * @param error - The error object from the API
   * @param fallbackMessage - Optional fallback message if no error details are found
   */
  const handleError = useCallback((error: ApiError, fallbackMessage?: string) => {
    // Handle validation errors from CustomHttpError payload
    if (error?.payload && typeof error.payload === 'object') {
      const errors = error.payload;
      const errorList = Object.entries(errors).map(([field, message]) => {
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `• ${fieldName}: ${message}`;
      });
      
      if (errorList.length > 0) {
        console.error('Validation errors:', errors);
        notifyError(`Please fix the following errors:\n${errorList.join('\n')}`);
        return;
      }
    }
    
    // Handle errors in response.data.errors format
    if (error?.response?.data?.errors) {
      const errors = error.response.data.errors;
      const errorList = Object.entries(errors).map(([field, message]) => {
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `• ${fieldName}: ${message}`;
      });
      console.error('Validation errors:', errors);
      notifyError(`Please fix the following errors:\n${errorList.join('\n')}`);
      return;
    }
    
    // Handle single error message
    const errorMessage = error?.message || 
                        error?.response?.data?.message || 
                        fallbackMessage || 
                        'An error occurred';
    notifyError(errorMessage);
  }, []);

  /**
   * Handle API success responses
   * @param response - The response object from the API
   * @param fallbackMessage - Optional fallback message if no success message is found
   */
  const handleSuccess = useCallback((response: any, fallbackMessage?: string) => {
    const successMessage = response?.data?.data?.message || 
                          response?.data?.message || 
                          response?.message || 
                          fallbackMessage || 
                          'Operation completed successfully';
    notifySuccess(successMessage);
  }, []);

  return {
    handleError,
    handleSuccess,
  };
}
