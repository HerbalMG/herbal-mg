import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPayments, createPayment, updatePayment, deletePayment } from '../lib/paymentApi';

const PaymentTable = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'admin') {
    return <div className="p-8 text-red-600 font-bold">Access denied</div>;
  }

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    fromDate: '',
    toDate: '',
    search: '',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRowData, setEditRowData] = useState({ amount: '', method: '', status: '' });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPayments();
      console.log('Fetched payments:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPayments(data);
      } else {
        console.error('Payments data is not an array:', data);
        setPayments([]);
        setError('Invalid payment data format');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const stats = useMemo(() => {
    if (!Array.isArray(payments)) {
      return {
        total: 0,
        totalAmount: 0,
        paid: 0,
        unpaid: 0,
        refunded: 0,
        paidAmount: 0,
      };
    }
    
    return {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      paid: payments.filter(p => p.status === 'Paid').length,
      unpaid: payments.filter(p => p.status === 'Unpaid').length,
      refunded: payments.filter(p => p.status === 'Refunded').length,
      paidAmount: payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    };
  }, [payments]);

  const handleFilterChange = (e) => {
    setCurrentPage(1);
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredPayments = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    
    let result = payments.filter((payment) => {
      const matchesStatus = filters.status === '' || payment.status === filters.status;
      const matchesMethod = filters.method === '' || (payment.method && payment.method.toLowerCase().includes(filters.method.toLowerCase()));
      const matchesSearch = !filters.search || 
                           (payment.invoiceNumber && payment.invoiceNumber.toLowerCase().includes(filters.search.toLowerCase())) ||
                           (payment.orderId && payment.orderId.toLowerCase().includes(filters.search.toLowerCase())) ||
                           (payment.order_id && payment.order_id.toLowerCase().includes(filters.search.toLowerCase()));

      const paymentDate = new Date(payment.date || payment.created_at);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;
      const matchesDate = (!fromDate || paymentDate >= fromDate) && (!toDate || paymentDate <= toDate);

      return matchesStatus && matchesMethod && matchesSearch && matchesDate;
    });

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case 'method':
          aVal = a.method.toLowerCase();
          bVal = b.method.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [payments, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === paginatedPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(paginatedPayments.map(p => p.id));
    }
  };

  const toggleSelectPayment = (id) => {
    setSelectedPayments(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const headers = ['Sr.No', 'Order ID', 'Invoice #', 'Date', 'Amount', 'Method', 'Status'];
      const rows = filteredPayments.map((payment, idx) => [
        idx + 1,
        payment.orderId || payment.order_id || 'N/A',
        payment.invoiceNumber || payment.invoice_number || 'N/A',
        payment.date || payment.created_at || 'N/A',
        payment.amount || 0,
        payment.method || payment.payment_method || 'N/A',
        payment.status || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess('Payments exported successfully');
    } catch (err) {
      setError('Failed to export payments');
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      method: '',
      fromDate: '',
      toDate: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const startEditing = (index) => {
    const payment = paginatedPayments[index];
    setEditingIndex(index);
    setEditRowData({
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
    });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditRowData({ amount: '', method: '', status: '' });
  };

  const saveEditing = async () => {
    const globalIndex = startIndex + editingIndex;
    const paymentToUpdate = {
      ...payments[globalIndex],
      amount: parseFloat(editRowData.amount),
      method: editRowData.method,
      status: editRowData.status,
    };
    
    try {
      await updatePayment(paymentToUpdate.id, paymentToUpdate);
      const updatedPayments = [...payments];
      updatedPayments[globalIndex] = paymentToUpdate;
      setPayments(updatedPayments);
      showSuccess('Payment updated successfully');
      cancelEditing();
    } catch (err) {
      setError('Failed to update payment');
    }
  };

  const handleEditChange = (e) => {
    setEditRowData({ ...editRowData, [e.target.name]: e.target.value });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedPayments.length} payment(s)?`)) return;
    
    try {
      await Promise.all(selectedPayments.map(id => deletePayment(id)));
      setPayments(prev => prev.filter(p => !selectedPayments.includes(p.id)));
      setSelectedPayments([]);
      showSuccess(`${selectedPayments.length} payment(s) deleted successfully`);
    } catch (err) {
      setError('Failed to delete some payments');
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all payment transactions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <span>{loading ? '⟳' : '🔄'}</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={exportLoading || filteredPayments.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <span>📊</span>
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Payments" value={stats.total} icon="💳" color="blue" />
        <StatCard label="Total Amount" value={`₹${stats.totalAmount.toLocaleString()}`} icon="💰" color="purple" />
        <StatCard label="Paid" value={stats.paid} icon="✅" color="green" />
        <StatCard label="Unpaid" value={stats.unpaid} icon="⏳" color="orange" />
        <StatCard label="Refunded" value={stats.refunded} icon="↩️" color="yellow" />
        <StatCard label="Paid Amount" value={`₹${stats.paidAmount.toLocaleString()}`} icon="💵" color="teal" />
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              name="search"
              placeholder="Search Invoice # or Order ID..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              name="method"
              value={filters.method}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="Credit">Credit Card</option>
              <option value="COD">Cash on Delivery</option>
              <option value="Bank">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Per Page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          
          {(filters.search || filters.status || filters.method || filters.fromDate || filters.toDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            {selectedPayments.length} payment(s) selected
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
            <button 
              onClick={() => setSelectedPayments([])}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === paginatedPayments.length && paginatedPayments.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Sr No.</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Order Id</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Invoice #</th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {sortField === 'amount' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('method')}
                >
                  <div className="flex items-center gap-1">
                    Payment Method
                    {sortField === 'method' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">💳</span>
                      <p className="text-lg font-medium">No payments found</p>
                      <p className="text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment, index) => (
                  <tr key={payment.id || payment.invoiceNumber || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => toggleSelectPayment(payment.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-gray-700">{payment.orderId || payment.order_id || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-600">{payment.invoiceNumber || payment.invoice_number || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{payment.date || payment.created_at || 'N/A'}</td>

                    {/* Editable Amount */}
                    <td className="px-4 py-3 text-gray-700">
                      {editingIndex === index ? (
                        <input
                          type="number"
                          step="0.01"
                          name="amount"
                          value={editRowData.amount}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        `₹${(parseFloat(payment.amount) || 0).toLocaleString()}`
                      )}
                    </td>

                    {/* Editable Method */}
                    <td className="px-4 py-3 text-gray-700">
                      {editingIndex === index ? (
                        <select
                          name="method"
                          value={editRowData.method}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        >
                          <option value="Credit Card">Credit Card</option>
                          <option value="COD">Cash on Delivery</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                        </select>
                      ) : (
                        payment.method || payment.payment_method || 'N/A'
                      )}
                    </td>

                    {/* Editable Status */}
                    <td className="px-4 py-3">
                      {editingIndex === index ? (
                        <select
                          name="status"
                          value={editRowData.status}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'Unpaid'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {editingIndex === index ? (
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditing}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(index)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="text-sm text-gray-600">
          Showing {filteredPayments.length === 0 ? 0 : startIndex + 1} -{' '}
          {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length}
        </div>
        <Pagination
          currentPage={currentPage}
          pageCount={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

function Pagination({ currentPage, pageCount, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (pageCount <= maxVisible) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', pageCount);
      } else if (currentPage >= pageCount - 2) {
        pages.push(1, '...', pageCount - 3, pageCount - 2, pageCount - 1, pageCount);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', pageCount);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        ««
      </button>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        ‹ Prev
      </button>

      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 border rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        Next ›
      </button>
      <button
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(pageCount)}
        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
      >
        »»
      </button>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80">{label}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-70">{icon}</div>
      </div>
    </div>
  );
}

export default PaymentTable;
