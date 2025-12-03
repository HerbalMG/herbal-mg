import React from 'react';
import { useCart } from '../context/CartContext';
import PaymentButton from '../components/Payment/PaymentButton';
import CartTest from '../components/CartTest';

const TestPayment = () => {
  const { cartItems, getTotal } = useCart();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Cart Test</h2>
          <CartTest />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment Test</h2>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Current Cart:</h3>
            <p>Items: {cartItems.length}</p>
            <p>Total: ₹{getTotal()}</p>
            
            <div className="mt-4">
              <PaymentButton
                orderId={`TEST_ORDER_${Date.now()}`}
                amount={getTotal() || 100}
                userId="test_user_123"
                mobileNumber="9876543210"
                onPaymentInitiated={(response) => {
                  console.log('Payment initiated:', response);
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPayment;