import React from 'react';
import OrderRow from './OrderRow';

const OrderTable = ({
  orders,
  visibleColumns,
  selectedIds,
  toggleSelectAll,
  toggleSelectRow,
  sortConfig,
  handleSort,
  expandedItems,
  toggleItemExpansion,
  handleStatusChange,
  onViewDetails,
  currentPage,
  entriesPerPage,
}) => {
  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.includes(o.id));

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              {visibleColumns.srNo && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Sr No</th>}
              {visibleColumns.orderId && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Order ID</th>}
              {visibleColumns.customerName && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Customer</th>}
              {visibleColumns.date && (
                <th
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
              )}
              {visibleColumns.price && (
                <th
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    Price
                    {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>
              )}
              {visibleColumns.status && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>}
              {visibleColumns.items && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Items</th>}
              {visibleColumns.address && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Address</th>}
              {visibleColumns.payment_type && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Payment</th>}
              {visibleColumns.prescription && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Prescription</th>}
              {visibleColumns.notes && <th className="px-4 py-3 text-left text-gray-700 font-semibold">Notes</th>}
              <th className="px-4 py-3 text-left text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="text-center p-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📦</span>
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Try adjusting your filters or search criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  index={idx}
                  visibleColumns={visibleColumns}
                  selected={selectedIds.includes(order.id)}
                  expanded={expandedItems[order.id]}
                  onToggleSelect={() => toggleSelectRow(order.id)}
                  onToggleExpand={() => toggleItemExpansion(order.id)}
                  onStatusChange={handleStatusChange}
                  onViewDetails={() => onViewDetails(order)}
                  currentPage={currentPage}
                  entriesPerPage={entriesPerPage}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
