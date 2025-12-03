import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class PaymentService {
  
  // Initialize PhonePe payment
  async initiatePhonePePayment(paymentData) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/payments/phonepe/initiate`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Payment initiation failed');
    }
  }

  // Check payment status
  async checkPaymentStatus(merchantTransactionId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/payments/phonepe/status/${merchantTransactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Status check failed');
    }
  }

  // Get all payments (admin only)
  async getAllPayments() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch payments');
    }
  }

  // Redirect to PhonePe payment page
  redirectToPayment(paymentUrl) {
    window.location.href = paymentUrl;
  }
}

export default new PaymentService();