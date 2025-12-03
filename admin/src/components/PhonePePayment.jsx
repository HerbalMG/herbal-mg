import React, { useState } from 'react';
import { initiatePhonePePayment, checkPhonePeStatus } from '../lib/paymentApi';

const PhonePePayment = ({ orderId, onPaymentSuccess, onPaymentFailure }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    orderId: orderId || '',
    amount: '',
    customerPhone: '',
    customerEmail: ''
  });

  const handleInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.orderId || !paymentData.amount || !paymentData.customerPhone) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await initiatePhonePePayment(paymentData);
      
      if (response.success) {
        // Redirect to PhonePe payment page
        window.open(response.paymentUrl, '_blank');
        
        // Start polling for payment status
        pollPaymentStatus(response.merchantTransactionId);
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment: ' + error.message);
      if (onPaymentFailure) onPaymentFailure(error);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (merchantTransactionId) => {
    const maxAttempts = 30; // Poll for 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const statusResponse = await checkPhonePeStatus(merchantTransactionId);
        
        if (statusResponse.success && statusResponse.payment) {
          const status = statusResponse.payment.status;
          
          if (status === 'SUCCESS') {
            if (onPaymentSuccess) onPaymentSuccess(statusResponse.payment);
            return;
          } else if (status === 'FAILED') {
            if (onPaymentFailure) onPaymentFailure(new Error('Payment failed'));
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          console.log('Payment status polling timeout');
        }
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
      }
    };

    // Start checking after 5 seconds
    setTimeout(checkStatus, 5000);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <img 
          src="https://logos-world.net/wp-content/uploads/2023/02/PhonePe-Logo.png" 
          alt="PhonePe" 
          className="h-8 mr-3"
        />
        <h2 className="text-xl font-semibold text-gray-800">PhonePe Payment</h2>
      </div>

      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order ID *
          </label>
          <input
            type="text"
            name="orderId"
            value={paymentData.orderId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹) *
          </label>
          <input
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handleInputChange}
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Phone *
          </label>
          <input
            type="tel"
            name="customerPhone"
            value={paymentData.customerPhone}
            onChange={handleInputChange}
            pattern="[0-9]{10}"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email
          </label>
          <input
            type="email"
            name="customerEmail"
            value={paymentData.customerEmail}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay with PhonePe'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Secure payment powered by PhonePe</p>
        <p>• Supports UPI, Cards, Net Banking & Wallets</p>
        <p>• Payment window will open in a new tab</p>
      </div>
    </div>
  );
};

export default PhonePePayment;