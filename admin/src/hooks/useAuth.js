/**
 * useAuth Hook for Admin Panel
 * Manages authentication state and auto-logout
 */

import { useEffect, useState } from 'react';
import { authUtils } from '../utils/auth';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authUtils.isAuthenticated());
  const [user, setUser] = useState(authUtils.getUser());

  useEffect(() => {
    // Check if authenticated
    const authenticated = authUtils.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (!authenticated) {
      return;
    }

    // Setup auto-logout when token expires
    const cleanupAutoLogout = authUtils.setupAutoLogout(() => {
      setIsAuthenticated(false);
      setUser(null);
    });

    // Check expiration every 5 minutes
    const cleanupExpirationCheck = authUtils.startExpirationCheck(5);

    // Cleanup on unmount
    return () => {
      cleanupAutoLogout();
      cleanupExpirationCheck();
    };
  }, []);

  const login = (token, expiresAt, userData) => {
    authUtils.saveAuth(token, expiresAt, userData);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    authUtils.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    login,
    logout,
    getToken: authUtils.getToken
  };
};

export default useAuth;
