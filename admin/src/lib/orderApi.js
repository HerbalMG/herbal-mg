import { handleApiError } from '../utils/errorHandler';
import { getAuthHeaders } from '../utils/tokenHelper';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to handle fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
    error.response = {
      status: response.status,
      data: errorData
    };
    throw error;
  }
  return await response.json();
};

// Get all orders (for admin - includes all orders)
export const getOrders = async () => {
  try {
    const response = await fetch(`${API_BASE}/order`, {
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse(response);
    console.log('Orders fetched successfully:', data.length);
    return data;
  } catch (error) {
    handleApiError(error, 'getOrders');
    throw error;
  }
};

// Get order by ID
export const getOrder = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/order/${id}`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    handleApiError(error, 'getOrder');
    throw error;
  }
};

// Create order
export const createOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE}/order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    
    return await handleResponse(response);
  } catch (error) {
    handleApiError(error, 'createOrder');
    throw error;
  }
};

// Update order
export const updateOrder = async (id, orderData) => {
  try {
    const response = await fetch(`${API_BASE}/order/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    
    return await handleResponse(response);
  } catch (error) {
    handleApiError(error, 'updateOrder');
    throw error;
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/order/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  } catch (error) {
    handleApiError(error, 'deleteOrder');
    throw error;
  }
};