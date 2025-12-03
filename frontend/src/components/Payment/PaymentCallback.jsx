import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import toast from 'react-hot-toast';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const transactionId = searchParams.get('transactionId');
      
      if (!transactionId) {
        setStatus('error');
        toast.error('Invalid payment callback');
        return;
      }

      try {
        const response = await paymentService.checkPaymentStatus(transactionId);
        
        if (response.success) {
          setPaymentDetails(response.payment);
          
          if (response.status === 'SUCCESS') {
            setStatus('success');
            toast.success('Payment successful!');
          } else {
            setStatus('failed');
            toast.error('Payment failed');
          }
        } else {
          setStatus('error');
          toast.error('Unable to verify payment status');
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        setStatus('error');
        toast.error('Payment verification failed');
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/orders'); // Redirect to orders page
    } else {
      navigate('/cart'); // Redirect back to cart
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully.
            </p>
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <p><strong>Amount:</strong> ₹{paymentDetails.amount}</p>
                <p><strong>Order ID:</strong> {paymentDetails.order_id}</p>
                <p><strong>Transaction ID:</strong> {paymentDetails.transaction_id}</p>
              </div>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-4">
              Your payment could not be processed. Please try again.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Payment Status Unknown
            </h2>
            <p className="text-gray-600 mb-4">
              We couldn't verify your payment status. Please contact support.
            </p>
          </>
        )}

        {status !== 'checking' && (
          <button
            onClick={handleContinue}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;