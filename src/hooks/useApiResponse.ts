import { useCallback } from 'react';
import { notifyError, notifySuccess } from '@/util/utils';

interface ApiError {
  message?: string;
  responseText?: string;
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
      
      // Check if errors is an array
      if (Array.isArray(errors)) {
        // If it's an array, just show the first error or join them
        const errorList = errors.filter(Boolean).map((msg, index) => `• ${msg}`);
        
        if (errorList.length > 0) {
          console.error('Validation errors (array):', errors);
          notifyError(`Please fix the following errors:\n${errorList.join('\n')}`);
          return;
        }
      } else {
        // If it's an object, extract the first error message
        // Handle both string messages and array of messages
        const firstError = Object.values(errors).flat().find(msg => msg && typeof msg === 'string');
        
        if (firstError) {
          console.error('Validation errors (object):', errors);
          // Show just the error message without field name
          notifyError(firstError);
          return;
        }
      }
    }
    
    // Handle errors in response.data.errors format
    if (error?.response?.data?.errors) {
      const errors = error.response.data.errors;
      
      // Check if errors is an array
      if (Array.isArray(errors)) {
        const errorList = errors.filter(Boolean).map((msg, index) => `• ${msg}`);
        console.error('Validation errors (array):', errors);
        notifyError(`Please fix the following errors:\n${errorList.join('\n')}`);
        return;
      } else {
        // If it's an object, extract the first error message
        // Handle both string messages and array of messages
        const firstError = Object.values(errors).flat().find(msg => msg && typeof msg === 'string');
        
        if (firstError) {
          console.error('Validation errors (object):', errors);
          // Show just the error message without field name
          notifyError(firstError);
          return;
        }
      }
    }
    
    // Handle single error message
    // Check CustomHttpError properties first (message, responseText)
    // Then check standard Axios error structure (response.data.message)
    const errorMessage = error?.message || 
                        error?.responseText ||
                        error?.response?.data?.message || 
                        fallbackMessage || 
                        'An error occurred';
    
    console.error('API Error:', error);
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
