import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getOrders, updateOrder, deleteOrder } from '../lib/orderApi';
import { getCustomers } from '../lib/customerApi';
import { getPayments } from '../lib/paymentApi';
import CreateOrderForm from '../components/OrderForm';
import OrderStats from '../components/orders/OrderStats';
import OrderFilters from '../components/orders/OrderFilters';
import OrderTable from '../components/orders/OrderTable';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import ConfirmModal from '../components/orders/ConfirmModal';
import Pagination from '../components/orders/Pagination';

export default function OrdersPro() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'admin') {
    return <div className="p-8 text-red-600 font-bold">Access denied</div>;
  }

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // UI State
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [showDetailsOrder, setShowDetailsOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    srNo: true,
    orderId: true,
    customerName: true,
    date: true,
    price: true,
    status: true,
    items: true,
    address: false,
    payment_type: true,
    prescription: true,
    notes: false,
  });

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, customerData, paymentData] = await Promise.all([
        getOrders(),
        getCustomers().catch(() => []),
        getPayments().catch(() => []),
      ]);

      const customerMap = Object.fromEntries(customerData.map((c) => [c.id, c]));
      const paymentMap = Object.fromEntries(paymentData.map((p) => [p.id, p]));

      const enrichedOrders = ordersData
        .filter((o) => o.status !== 'Replacement')
        .map((order) => {
          const customer = customerMap[order.customer_id];
          const payment = paymentMap[order.payment_id];

          return {
            ...order,
            customer_name: order.customer_name || customer?.name || 'Unknown Customer',
            payment_method: order.payment_method || payment?.method || 'N/A',
          };
        });

      setOrders(enrichedOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filtering, Searching, Sorting
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filterStatus !== 'All') {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(lower) ||
          String(o.id).toLowerCase().includes(lower) ||
          (o.items && JSON.stringify(o.items).toLowerCase().includes(lower))
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((o) => new Date(o.order_date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter((o) => new Date(o.order_date) <= new Date(dateTo));
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'price') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (sortConfig.key === 'date') {
          const dateA = new Date(aVal);
          const dateB = new Date(bVal);
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        aVal = aVal?.toString().toLowerCase();
        bVal = bVal?.toString().toLowerCase();
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return filtered;
  }, [orders, filterStatus, searchTerm, sortConfig, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredOrders.length / entriesPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Handlers
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleItemExpansion = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleColumn = (col) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: newStatus } : order)));
      await updateOrder(id, { status: newStatus });
      showSuccess('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
      fetchOrders();
    }
  };

  const handleBulkStatusChange = (status) => {
    setPendingAction({ type: 'bulkStatus', status });
    setShowConfirmModal(true);
  };

  const handleBulkDelete = () => {
    setPendingAction({ type: 'bulkDelete' });
    setShowConfirmModal(true);
  };

  const handleExport = () => {
    try {
      const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
      const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Amount', 'Payment'];
      const rows = selectedOrders.map((o) => [
        o.id,
        o.customer_name,
        new Date(o.order_date).toLocaleDateString(),
        o.status,
        o.total_amount,
        o.payment_method,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess('Orders exported successfully');
    } catch (err) {
      setError('Failed to export orders');
    }
  };

  const confirmAction = async () => {
    if (pendingAction.type === 'bulkStatus') {
      try {
        await Promise.all(
          selectedIds.map((id) => updateOrder(id, { status: pendingAction.status }))
        );
        setOrders((prev) =>
          prev.map((order) =>
            selectedIds.includes(order.id) ? { ...order, status: pendingAction.status } : order
          )
        );
        showSuccess(`${selectedIds.length} order(s) updated successfully`);
        setSelectedIds([]);
      } catch (err) {
        setError('Failed to update some orders');
      }
    } else if (pendingAction.type === 'bulkDelete') {
      try {
        await Promise.all(selectedIds.map((id) => deleteOrder(id)));
        setOrders((prev) => prev.filter((order) => !selectedIds.includes(order.id)));
        showSuccess(`${selectedIds.length} order(s) deleted successfully`);
        setSelectedIds([]);
      } catch (err) {
        setError('Failed to delete some orders');
      }
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, entriesPerPage, dateFrom, dateTo]);

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <span>{loading ? '⟳' : '🔄'}</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <a
            href="/replacements"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <span>🔄</span>
            Replacements
          </a>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>+</span>
            Create Order
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            ✕
          </button>
        </div>
      )}

      {/* Statistics */}
      <OrderStats orders={filteredOrders} />

      {/* Filters */}
      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        selectedIds={selectedIds}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
      />

      {/* Table */}
      <OrderTable
        orders={paginatedOrders}
        visibleColumns={visibleColumns}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        toggleSelectRow={toggleSelectRow}
        sortConfig={sortConfig}
        handleSort={handleSort}
        expandedItems={expandedItems}
        toggleItemExpansion={toggleItemExpansion}
        handleStatusChange={handleStatusChange}
        onViewDetails={setShowDetailsOrder}
        currentPage={currentPage}
        entriesPerPage={entriesPerPage}
      />

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-700">
            Entries per page:
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="ml-2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, filteredOrders.length)} of {filteredOrders.length}
          </div>
        </div>
        <Pagination currentPage={currentPage} pageCount={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Modals */}
      {showDetailsOrder && (
        <OrderDetailsModal order={showDetailsOrder} onClose={() => setShowDetailsOrder(null)} />
      )}

      {showCreateModal && (
        <CreateOrderForm
          onClose={() => setShowCreateModal(false)}
          onCreated={(newOrder) => {
            setOrders((prev) => [newOrder, ...prev]);
            showSuccess('Order created successfully');
          }}
        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          title="Confirm Action"
          message={
            pendingAction?.type === 'bulkDelete'
              ? `Are you sure you want to delete ${selectedIds.length} order(s)?`
              : `Are you sure you want to change status to "${pendingAction?.status}" for ${selectedIds.length} order(s)?`
          }
          onConfirm={confirmAction}
          onCancel={() => {
            setShowConfirmModal(false);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
