// Error handling utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      status: error.response.status,
      message: error.response.data?.error || error.response.data?.message || 'Server error occurred',
      details: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 0,
      message: 'No response from server. Check your connection.',
      details: error.request
    };
  } else {
    // Error in request setup
    return {
      status: 0,
      message: error.message || 'An error occurred',
      details: error
    };
  }
};

export const logError = (error, context = '') => {
  console.error(`[${context}]`, error);
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    // trackException(error, context);
  }
};

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
};

export const isNetworkError = (error) => {
  return !error.response || error.message === 'Network Error';
};

export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

export const isValidationError = (error) => {
  return error.response?.status === 400;
};

export default {
  handleApiError,
  logError,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isValidationError
};
