import React from 'react';

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const formatAddress = (address) => {
    try {
      const addr = typeof address === 'string' ? JSON.parse(address) : address;

      if (typeof addr === 'object' && addr !== null) {
        return (
          <div className="space-y-1">
            {/* Full Name */}
            {(addr.full_name || addr.fullName) && (
              <p className="font-medium text-base">{addr.full_name || addr.fullName}</p>
            )}
            
            {/* Contact */}
            {(addr.contact || addr.phone) && (
              <p className="text-gray-700">📞 {addr.contact || addr.phone}</p>
            )}
            
            {/* Email */}
            {addr.email && (
              <p className="text-gray-700">✉️ {addr.email}</p>
            )}
            
            {/* Address Line 1 (house number, area, landmark) */}
            {addr.address_line1 && (
              <p className="text-gray-800">{addr.address_line1}</p>
            )}
            
            {/* Legacy address field */}
            {!addr.address_line1 && addr.address && (
              <p className="text-gray-800">{addr.address}</p>
            )}
            
            {/* Address Line 2 */}
            {addr.address_line2 && (
              <p className="text-gray-700">{addr.address_line2}</p>
            )}
            
            {/* City, State, Pincode */}
            {(addr.city || addr.state || addr.pincode) && (
              <p className="text-gray-800 font-medium">
                {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
              </p>
            )}
            
            {/* Country */}
            {addr.country && addr.country !== 'India' && (
              <p className="text-gray-700">{addr.country}</p>
            )}
          </div>
        );
      }
      return <p className="text-gray-700">{String(addr)}</p>;
    } catch (e) {
      return <p className="text-gray-700">{address}</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Order ID</p>
              <p className="text-lg font-medium text-gray-900">{order.id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'Delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'Shipped'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : order.status === 'Refunded'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Customer</p>
              <p className="text-gray-900">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Order Date</p>
              <p className="text-gray-900">
                {order.order_date ? new Date(order.order_date).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Order Items ({order.items?.length || 0})
            </h3>
            {order.items && order.items.length > 0 ? (
              <div className="bg-gray-50 rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Qty</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-3 text-gray-900">{item.product_name || 'Unknown Product'}</td>
                        <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700">₹{Number(item.price).toFixed(2)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No items</p>
            )}
          </div>

          {/* Total Amount */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                ₹{order.total_amount ? Number(order.total_amount).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping Address</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-900 text-sm">
              {formatAddress(order.address)}
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">
                <span className="font-medium">Method:</span> {order.payment_method || 'N/A'}
              </p>
            </div>
          </div>

          {/* Prescription */}
          {order.prescription_url && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Prescription</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <a
                  href={order.prescription_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
                    />
                  </svg>
                  View Prescription
                </a>
                {order.prescription_url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                  <img
                    src={order.prescription_url}
                    alt="Prescription"
                    className="mt-3 max-w-full h-auto rounded-lg border"
                    style={{ maxHeight: '300px' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-900">{order.notes}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
