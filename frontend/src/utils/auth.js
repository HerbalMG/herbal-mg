/**
 * Authentication utilities for Frontend
 * Handles token storage, expiration checking, and auto-logout
 */

const TOKEN_KEY = 'token';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const USER_KEY = 'user';

export const authUtils = {
  /**
   * Save authentication data
   */
  saveAuth(token, expiresAt, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored user
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;

    const expiryDate = new Date(expiryStr);
    const now = new Date();
    
    return now >= expiryDate;
  },

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry() {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return 0;

    const expiryDate = new Date(expiryStr);
    const now = new Date();
    
    return Math.max(0, expiryDate.getTime() - now.getTime());
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    
    return true;
  },

  /**
   * Logout - clear all auth data
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Redirect to login
    window.location.href = '/login';
  },

  /**
   * Setup auto-logout timer
   * Returns cleanup function
   */
  setupAutoLogout(onLogout) {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    
    if (timeUntilExpiry <= 0) {
      this.logout();
      return () => {};
    }

    console.log(`🔐 Token expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);

    // Set timer to logout when token expires
    const timer = setTimeout(() => {
      console.log('🔐 Token expired - logging out');
      if (onLogout) onLogout();
      this.logout();
    }, timeUntilExpiry);

    // Return cleanup function
    return () => clearTimeout(timer);
  },

  /**
   * Check token expiration periodically
   * Returns cleanup function
   */
  startExpirationCheck(intervalMinutes = 5) {
    const checkExpiration = () => {
      if (this.isTokenExpired()) {
        console.log('🔐 Token expired - logging out');
        this.logout();
      }
    };

    // Check immediately
    checkExpiration();

    // Check periodically
    const interval = setInterval(checkExpiration, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => clearInterval(interval);
  }
};

export default authUtils;
