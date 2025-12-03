import React, { useState } from 'react';
import paymentService from '../../services/paymentService';
import toast from 'react-hot-toast';

const PaymentButton = ({ 
  orderId, 
  amount, 
  userId, 
  mobileNumber, 
  onPaymentInitiated,
  disabled = false,
  className = ""
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    console.log('Payment data:', { orderId, amount, userId, mobileNumber });
    
    if (!orderId || !amount || !userId || !mobileNumber) {
      toast.error('Missing required payment information');
      return;
    }

    setIsProcessing(true);
    
    try {
      const paymentData = {
        orderId,
        amount,
        userId,
        mobileNumber
      };

      console.log('Initiating payment with data:', paymentData);
      const response = await paymentService.initiatePhonePePayment(paymentData);
      console.log('Payment response:', response);
      
      if (response.success) {
        toast.success('Redirecting to payment gateway...');
        
        // Call callback if provided
        if (onPaymentInitiated) {
          onPaymentInitiated(response);
        }
        
        // Redirect to PhonePe payment page
        setTimeout(() => {
          paymentService.redirectToPayment(response.paymentUrl);
        }, 1000);
      } else {
        toast.error('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      className={`
        bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg
        transition-colors duration-200 flex items-center justify-center space-x-2
        disabled:opacity-50 disabled:cursor-not-allowed
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
          <span>Pay with PhonePe</span>
          <span className="font-bold">₹{amount}</span>
        </>
      )}
    </button>
  );
};

export default PaymentButton;