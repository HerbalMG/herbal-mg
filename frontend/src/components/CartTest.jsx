import React from 'react';
import { useCart } from '../context/CartContext';

const CartTest = () => {
  const { addToCart, cartItems, getTotalItems } = useCart();

  const testProducts = [
    {
      id: 1,
      name: "Test Product 1",
      price: 100,
      image: "https://via.placeholder.com/150",
      size: "100ml"
    },
    {
      id: 2,
      name: "Test Product 2", 
      price: 200,
      image: "https://via.placeholder.com/150",
      size: "200ml"
    }
  ];

  const handleAddTestProduct = (product) => {
    addToCart(product);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 m-4">
      <h3 className="text-lg font-semibold mb-4">Cart Test Component</h3>
      <p className="mb-4">Current cart items: {getTotalItems()}</p>
      
      <div className="space-y-2 mb-4">
        {testProducts.map(product => (
          <button
            key={product.id}
            onClick={() => handleAddTestProduct(product)}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Add {product.name}
          </button>
        ))}
      </div>

      <div className="text-sm">
        <p>Cart contents:</p>
        <pre className="bg-white p-2 rounded text-xs overflow-auto">
          {JSON.stringify(cartItems, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default CartTest;