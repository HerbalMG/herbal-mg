import React, { useState, useEffect } from 'react';
import { getOrders, updateOrder } from '../lib/orderApi';
import toast from 'react-hot-toast';

const Replacements = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'admin') {
    return <div className="p-8 text-red-600 font-bold">Access denied</div>;
  }

  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReplacements();
  }, []);

  const loadReplacements = async () => {
    try {
      setLoading(true);
      const allOrders = await getOrders();
      
      // Filter only replacement orders
      const replacementOrders = allOrders.filter(order => 
        order.status === 'Replacement' || order.replacement_image
      );
      
      setReplacements(replacementOrders);
    } catch (error) {
      console.error('Error loading replacements:', error);
      toast.error('Failed to load replacement requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      
      // Update local state
      setReplacements(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredReplacements = replacements.filter(order => {
    const matchesSearch = searchTerm
      ? order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Replacement': 'bg-purple-100 text-purple-800',
      'Shipped': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Refunded': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading replacement requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Replacement Requests</h1>
        <p className="text-gray-600">Manage customer replacement requests and view uploaded images</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-purple-900">{replacements.length}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-blue-900">
                {replacements.filter(r => r.status === 'Replacement').length}
              </p>
            </div>
            <div className="bg-blue-200 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {replacements.filter(r => r.status === 'Delivered').length}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">With Images</p>
              <p className="text-2xl font-bold text-orange-900">
                {replacements.filter(r => r.replacement_image).length}
              </p>
            </div>
            <div className="bg-orange-200 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="search"
              placeholder="Search by customer name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Status</option>
            <option value="Replacement">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>

          <button
            onClick={loadReplacements}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Replacements List */}
      {filteredReplacements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Replacement Requests</h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'All' 
              ? 'No replacements match your filters' 
              : 'No replacement requests have been made yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReplacements.map((replacement) => (
            <div
              key={replacement.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      Order #{replacement.id?.substring(0, 12)}...
                    </h3>
                    <p className="text-sm text-gray-600">{replacement.customer_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(replacement.status)}`}>
                    {replacement.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(replacement.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Replacement Image */}
              {replacement.replacement_image && (
                <div className="p-4 bg-purple-50">
                  <p className="text-xs font-medium text-purple-700 mb-2">Replacement Image:</p>
                  <div className="relative group">
                    <img
                      src={replacement.replacement_image}
                      alt="Replacement"
                      className="w-full h-48 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(replacement.replacement_image, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{replacement.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-gray-900">₹{replacement.total_amount}</span>
                  </div>
                </div>

                {/* Notes */}
                {replacement.notes && (
                  <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-700">
                    <p className="font-medium mb-1">Notes:</p>
                    <p className="line-clamp-2">{replacement.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedReplacement(replacement);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                  
                  {replacement.status === 'Replacement' && (
                    <select
                      onChange={(e) => handleStatusUpdate(replacement.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      defaultValue=""
                    >
                      <option value="" disabled>Update Status</option>
                      <option value="Shipped">Mark as Shipped</option>
                      <option value="Delivered">Mark as Delivered</option>
                      <option value="Cancelled">Cancel</option>
                      <option value="Refunded">Refund</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedReplacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Replacement Details</h2>
                <p className="text-sm text-gray-600">Order #{selectedReplacement.id}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedReplacement.customer_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedReplacement.customer_email || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedReplacement.customer_mobile || 'N/A'}</p>
                </div>
              </div>

              {/* Replacement Image */}
              {selectedReplacement.replacement_image && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Replacement Image</h3>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <img
                      src={selectedReplacement.replacement_image}
                      alt="Replacement"
                      className="w-full rounded-lg cursor-pointer"
                      onClick={() => window.open(selectedReplacement.replacement_image, '_blank')}
                    />
                    <a
                      href={selectedReplacement.replacement_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Order Items</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedReplacement.items && selectedReplacement.items.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Product</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReplacement.items.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2">{item.product_name || 'Product'}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">₹{item.price}</td>
                            <td className="text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold">
                          <td colSpan="3" className="text-right py-2">Total:</td>
                          <td className="text-right py-2">₹{selectedReplacement.total_amount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <p className="text-gray-500">No items found</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedReplacement.notes && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Replacement Notes</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedReplacement.notes}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Update Status</h3>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      handleStatusUpdate(selectedReplacement.id, e.target.value);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    defaultValue={selectedReplacement.status}
                  >
                    <option value="Replacement">Replacement</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Replacements;
