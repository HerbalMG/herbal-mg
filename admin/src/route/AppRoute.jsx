import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import EnhancedDashboard from '../pages/EnhancedDashboard';
import Management from '../pages/Management';
import ProductManagement from '../pages/ProductManagement';
import BrandManagement from '../pages/BrandManagement';
import Orders from '../pages/Orders';
import Replacements from '../pages/Replacements';
import Customer from '../pages/Customer';
import Inventory from '../pages/Inventory';
import DeliveryStatus from '../pages/DeliveryStatus';
import PaymentPage from '../pages/PaymentPage';
import Blog from '../pages/Blog';
import PrivateRoute from '../components/PrivateRoute';

const AppRoutes = ({ isAuthenticated, onLogin }) => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onLogin={onLogin} />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onLogin={onLogin} />
        }
      />
      <Route path="/dashboard" element={<PrivateRoute><EnhancedDashboard /></PrivateRoute>} />
      <Route path="/management" element={<PrivateRoute><Management /></PrivateRoute>} />
      <Route path="/product-management" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
      <Route path="/brand-management" element={<PrivateRoute><BrandManagement /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/replacements" element={<PrivateRoute><Replacements /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customer /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
      <Route path="/delivery-status" element={<PrivateRoute><DeliveryStatus /></PrivateRoute>} />
      <Route path="/payment" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
      <Route path="/blogs" element={<PrivateRoute><Blog /></PrivateRoute>} />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
