import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const TestPaymentButton = ({ 
  orderId, 
  amount, 
  userId, 
  mobileNumber,
  shippingAddress,
  deliveryOption,
  orderNotes,
  prescriptionUrl,
  cartItems,
  onPaymentInitiated,
  disabled = false,
  className = ""
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const navigate = useNavigate();

  const handleTestPayment = async (status) => {
    setIsProcessing(true);
    
    try {
      // Check if user is logged in
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const authToken = localStorage.getItem('authToken');
      const customerId = user.id;
      
      if (!authToken || !customerId) {
        toast.error('Please login to complete payment');
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      
      const testTransactionId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (status === 'success') {
        
        // Create order in database
        const orderData = {
          customer_id: customerId,
          total_amount: amount,
          payment_status: 'completed',
          payment_method: 'test_payment',
          transaction_id: testTransactionId,
          shipping_address: shippingAddress,
          delivery_option: deliveryOption,
          order_notes: orderNotes,
          prescription_url: prescriptionUrl || null,
          items: cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            size: item.size
          }))
        };

        // Require auth token for orders
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };

        const response = await axios.post(`${API_BASE_URL}/order`, orderData, {
          headers
        });

        if (response.data) {
          toast.success('✅ Test Payment Successful!');
          
          // Clear cart
          localStorage.removeItem('cart');
          
          // Redirect to success page
          setTimeout(() => {
            navigate(`/order-success?orderId=${response.data.id}&transactionId=${testTransactionId}`);
          }, 1000);
        }
      } else {
        toast.error('❌ Test Payment Failed!');
        setShowTestModal(false);
      }
    } catch (error) {
      console.error('Test payment error:', error);
      toast.error(error.response?.data?.error || 'Failed to process test payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowTestModal(true)}
        disabled={disabled || isProcessing}
        className={`
          bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
          text-white font-semibold py-3 px-6 rounded-lg
          transition-all duration-200 flex items-center justify-center space-x-2
          disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
          ${className}
        `}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Test Payment</span>
            <span className="font-bold">₹{amount}</span>
          </>
        )}
      </button>

      {/* Test Payment Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Payment Gateway</h3>
              <p className="text-sm text-gray-600 mb-4">
                This is a test payment system for development purposes
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono text-xs">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold text-gray-900">₹{amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile:</span>
                    <span>{mobileNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleTestPayment('success')}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                ✅ Simulate Success
              </button>
              
              <button
                onClick={() => handleTestPayment('failed')}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                ❌ Simulate Failure
              </button>
              
              <button
                onClick={() => setShowTestModal(false)}
                disabled={isProcessing}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              💡 Use this for testing without a real payment gateway
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TestPaymentButton;
