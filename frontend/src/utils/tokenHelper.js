/**
 * Helper function to get auth token from localStorage
 * Checks both 'token' (new auth utils) and 'authToken' (old method)
 * for backward compatibility
 */
export const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
};

export const isLoggedIn = () => {
  const token = getAuthToken();
  const user = getUserInfo();
  return !!(token && user && user.id);
};
