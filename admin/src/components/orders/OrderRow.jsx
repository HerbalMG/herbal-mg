import React, { useState } from 'react';

const statusOptions = ['Ordered', 'Shipped', 'Delivered', 'Refunded', 'Cancelled'];

const OrderRow = ({
  order,
  index,
  visibleColumns,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onStatusChange,
  onViewDetails,
  currentPage,
  entriesPerPage,
}) => {
  const [noteEdit, setNoteEdit] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const handleNoteBlur = () => {
    if (noteEdit !== order.notes) {
      // Save note logic here
    }
    setIsEditingNote(false);
  };

  const formatAddress = (address) => {
    try {
      const addr = typeof address === 'string' ? JSON.parse(address) : address;
      if (typeof addr === 'object' && addr !== null) {
        return [addr.city, addr.state].filter(Boolean).join(', ') || 'Address';
      }
      return String(addr).substring(0, 30);
    } catch (e) {
      return String(address).substring(0, 30);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={onToggleExpand}>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="w-4 h-4 cursor-pointer"
          />
        </td>

        {visibleColumns.srNo && (
          <td className="px-4 py-3 text-center text-gray-700">
            {(currentPage - 1) * entriesPerPage + index + 1}
          </td>
        )}

        {visibleColumns.orderId && (
          <td className="px-4 py-3">
            <div className="font-medium text-blue-600">{order.id}</div>
          </td>
        )}

        {visibleColumns.customerName && (
          <td className="px-4 py-3 text-gray-700">{order.customer_name}</td>
        )}

        {visibleColumns.date && (
          <td className="px-4 py-3 text-gray-700">
            {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
          </td>
        )}

        {visibleColumns.price && (
          <td className="px-4 py-3 text-gray-700">
            ₹{order.total_amount ? Number(order.total_amount).toFixed(2) : '0.00'}
          </td>
        )}

        {visibleColumns.status && (
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <select
              className={`border rounded-lg px-2 py-1 text-xs font-semibold ${
                order.status === 'Delivered'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : order.status === 'Shipped'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : order.status === 'Cancelled'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : order.status === 'Refunded'
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-300'
              }`}
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </td>
        )}

        {visibleColumns.items && (
          <td className="px-4 py-3 text-gray-700">
            {order.items && Array.isArray(order.items) ? `${order.items.length} item(s)` : '0 items'}
          </td>
        )}

        {visibleColumns.address && (
          <td className="px-4 py-3 text-gray-700 max-w-xs">
            <div className="truncate" title={formatAddress(order.address)}>
              {formatAddress(order.address)}
            </div>
          </td>
        )}

        {visibleColumns.payment_type && (
          <td className="px-4 py-3 text-gray-700">{order.payment_method || 'N/A'}</td>
        )}

        {visibleColumns.prescription && (
          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
            {order.prescription_url ? (
              <a
                href={order.prescription_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View
              </a>
            ) : (
              <span className="text-gray-400 text-xs">No file</span>
            )}
          </td>
        )}

        {visibleColumns.notes && (
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              rows={2}
              value={isEditingNote ? noteEdit : order.notes || ''}
              onFocus={() => {
                setIsEditingNote(true);
                setNoteEdit(order.notes || '');
              }}
              onChange={(e) => setNoteEdit(e.target.value)}
              onBlur={handleNoteBlur}
              className="w-full border rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
              placeholder="Add note..."
            />
          </td>
        )}

        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium"
            onClick={onViewDetails}
          >
            View
          </button>
        </td>
      </tr>

      {/* Expanded Items Row */}
      {expanded && order.items && order.items.length > 0 && (
        <tr className="bg-gray-50">
          <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="px-6 py-4">
            <div className="text-sm">
              <h4 className="font-semibold mb-3 text-gray-800">Order Items:</h4>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item, itemIdx) => (
                      <tr key={itemIdx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{item.product_name || 'Unknown Product'}</td>
                        <td className="px-3 py-2 text-gray-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-gray-700">₹{Number(item.price).toFixed(2)}</td>
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default OrderRow;
