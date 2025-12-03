import React, { useState, useEffect } from 'react'
import AppRoutes from './route/AppRoute'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { useAuth } from './hooks/useAuth'

const App = () => {
  // Use auth hook for auto-logout functionality
  const { isAuthenticated: authHookAuthenticated, user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(authHookAuthenticated);

  // Update local state when auth hook changes
  useEffect(() => {
    setIsAuthenticated(authHookAuthenticated);
  }, [authHookAuthenticated]);

  // Log authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('👤 Admin authenticated:', user.username || user.name);
    }
  }, [isAuthenticated, user]);

  // Listen for login/logout in other tabs
  useEffect(() => {
    const handleStorage = () => {
      setIsAuthenticated(!!localStorage.getItem('user') || !!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Provide a callback to LoginPage to update auth state after login
  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <>
          <Sidebar />
          <div className="ml-60 overflow-x-hidden min-h-screen">
            <Navbar onLogout={handleLogout} />
            <main className="p-3">
              <AppRoutes isAuthenticated={isAuthenticated} onLogin={handleLogin} />
            </main>
          </div>
        </>
      ) : (
        <AppRoutes isAuthenticated={isAuthenticated} onLogin={handleLogin} />
      )}
    </BrowserRouter>
  )
}

export default App