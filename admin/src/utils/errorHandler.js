/**
 * Centralized Error Handler for Admin Panel
 */

import toast from 'react-hot-toast';

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);

  // Network errors
  if (error.message === 'Failed to fetch' || !navigator.onLine) {
    toast.error('Network error. Please check your connection.');
    return;
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message;

    switch (status) {
      case 400:
        toast.error(message || 'Invalid request. Please check your input.');
        break;
      case 401:
        toast.error('Session expired. Please login again.');
        // Redirect to login after a delay
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
        break;
      case 403:
        toast.error('Access denied. You do not have permission.');
        break;
      case 404:
        toast.error(message || 'Resource not found.');
        break;
      case 409:
        toast.error(message || 'Conflict. Resource already exists.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(message || 'An error occurred. Please try again.');
    }
  } else {
    // Generic errors
    toast.error(error.message || 'An unexpected error occurred.');
  }
};

/**
 * Wrap async functions with error handling
 */
export const withErrorHandling = (fn, context = '') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      throw error;
    }
  };
};

/**
 * Check if user is authenticated
 */
export const checkAuth = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.token || localStorage.getItem('token');

  if (!token) {
    toast.error('Please login to continue');
    window.location.href = '/login';
    return false;
  }

  return true;
};

/**
 * Check if user has admin role
 */
export const checkAdminRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role !== 'admin' && user.role !== 'limited_admin') {
    toast.error('Access denied. Admin privileges required.');
    return false;
  }

  return true;
};

/**
 * Safe JSON parse with fallback
 */
export const safeJsonParse = (str, fallback = {}) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

/**
 * Validate required fields
 */
export const validateRequired = (data, requiredFields) => {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    toast.error(`Missing required fields: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

export default {
  handleApiError,
  withErrorHandling,
  checkAuth,
  checkAdminRole,
  safeJsonParse,
  validateRequired
};
