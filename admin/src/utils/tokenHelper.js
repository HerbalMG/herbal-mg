/**
 * Helper function to get auth token from localStorage for Admin
 * Checks multiple locations for backward compatibility
 */
export const getAuthToken = () => {
  // Check standalone token first (new auth utils)
  const standaloneToken = localStorage.getItem('token');
  if (standaloneToken) return standaloneToken;
  
  // Check user.token (old method)
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) return user.token;
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  return null;
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
  return !!(token && user);
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please login.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};
