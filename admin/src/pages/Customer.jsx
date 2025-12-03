import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../lib/customerApi";

import CreateCustomerForm from "../components/CustomerForm";
import AddressManager from "../components/AddressManager";

export default function CustomerDetails() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "admin") {
    return <div className="p-8 text-red-600 font-bold">Access denied</div>;
  }

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("active");

  const [modal, setModal] = useState({ type: null, customer: null });
  const [showAddressManager, setShowAddressManager] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    setError(null);
    getCustomers()
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => {
        setCustomers([]);
        setLoading(false);
        setError("Failed to fetch customers");
      });
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const closeModal = () => setModal({ type: null, customer: null });

  const deleteCustomerHandler = (id) => {
    deleteCustomer(id)
      .then(() => {
        setCustomers((custs) => custs.filter((c) => c.id !== id));
        showSuccess("Customer deleted successfully");
      })
      .catch(() => setError("Failed to delete customer"));
    closeModal();
  };

  const handleBulkDelete = () => {
    if (selectedCustomers.length === 0) return;
    
    setModal({ 
      type: "bulkDelete", 
      customer: null,
      count: selectedCustomers.length 
    });
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(selectedCustomers.map(id => deleteCustomer(id)));
      setCustomers(prev => prev.filter(c => !selectedCustomers.includes(c.id)));
      setSelectedCustomers([]);
      showSuccess(`${selectedCustomers.length} customers deleted successfully`);
    } catch (err) {
      setError("Failed to delete some customers");
    }
    closeModal();
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === paginated.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(paginated.map(c => c.id));
    }
  };

  const toggleSelectCustomer = (id) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const headers = ["Sr.No", "Name", "Mobile", "Email", "Address 1", "Address 2", "Created At"];
      const rows = filtered.map((c, idx) => [
        idx + 1,
        c.name,
        c.mobile,
        c.email,
        c.addresses?.[0]?.formatted || "",
        c.addresses?.[1]?.formatted || "",
        new Date(c.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess("Customers exported successfully");
    } catch (err) {
      setError("Failed to export customers");
    } finally {
      setExportLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    let result = customers;

    // Filter by status
    if (filterStatus === "active") {
      result = result.filter(c => c.active);
    } else if (filterStatus === "inactive") {
      result = result.filter(c => !c.active);
    }

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((c) => 
        c.name.toLowerCase().includes(s) ||
        String(c.customer_id || "").toLowerCase().includes(s) ||
        c.mobile.includes(search) ||
        c.email.toLowerCase().includes(s) ||
        c.addresses?.some(addr => addr.formatted?.toLowerCase().includes(s))
      );
    }

    // Date range filter
    if (startDate || endDate) {
      result = result.filter((c) => {
        const date = new Date(c.created_at);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;
        return (!from || date >= from) && (!to || date <= to);
      });
    }

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "mobile":
          aVal = a.mobile;
          bVal = b.mobile;
          break;
        case "email":
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case "created_at":
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, search, startDate, endDate, filterStatus, sortField, sortOrder]);

  const pageCount = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.active).length,
    inactive: customers.filter(c => !c.active).length,
    thisMonth: customers.filter(c => {
      const date = new Date(c.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  }), [customers]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all your customers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={exportLoading || filtered.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <span>📊</span>
            {exportLoading ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={() => setModal({ type: "create", customer: null })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <span>+</span>
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Customers" value={stats.total} icon="👥" color="blue" />
        <StatCard label="Active" value={stats.active} icon="✅" color="green" />
        <StatCard label="Inactive" value={stats.inactive} icon="⏸️" color="gray" />
        <StatCard label="This Month" value={stats.thisMonth} icon="📅" color="purple" />
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters and Controls */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[250px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name, mobile, email, address..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Per Page
                </label>
                <select
                  value={itemsPerPage}
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {(search || startDate || endDate || filterStatus !== "active") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStartDate("");
                    setEndDate("");
                    setFilterStatus("active");
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCustomers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedCustomers.length} customer(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === paginated.length && paginated.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Sr.no</th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Customer Name
                        {sortField === "name" && (sortOrder === "asc" ? " ↑" : " ↓")}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("mobile")}
                    >
                      <div className="flex items-center gap-1">
                        Mobile
                        {sortField === "mobile" && (sortOrder === "asc" ? " ↑" : " ↓")}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortField === "email" && (sortOrder === "asc" ? " ↑" : " ↓")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Address 1</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Address 2</th>
                    <th 
                      className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1">
                        Created At
                        {sortField === "created_at" && (sortOrder === "asc" ? " ↑" : " ↓")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">Status</th>
                    {/* <th className="px-4 py-3 text-left text-gray-700 font-semibold">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center p-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">🔍</span>
                          <p className="text-lg font-medium">No customers found</p>
                          <p className="text-sm">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((c, idx) => (
                      <CustomerRow
                        key={c.id}
                        serial={(currentPage - 1) * itemsPerPage + idx + 1}
                        customer={c}
                        selected={selectedCustomers.includes(c.id)}
                        onToggleSelect={() => toggleSelectCustomer(c.id)}
                        onEdit={() => setModal({ type: "edit", customer: c })}
                        onDeactivate={() => setModal({ type: "deactivate", customer: c })}
                        onActivate={() => {
                          updateCustomer(c.id, { active: true }).then(() => {
                            setCustomers(prev => prev.map(cust => 
                              cust.id === c.id ? { ...cust, active: true } : cust
                            ));
                            showSuccess("Customer activated successfully");
                          });
                        }}
                        onDelete={() => setModal({ type: "delete", customer: c })}
                        onManageAddresses={() => setShowAddressManager(c.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
              {filtered.length} entries
            </div>
            <Pagination
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>

          {modal.type === "create" && (
            <CreateCustomerForm
              onClose={closeModal}
              onCreated={(newCustomer) => {
                setCustomers((prev) => [...prev, newCustomer]);
                showSuccess("Customer created successfully");
              }}
            />
          )}

          {modal.type === "edit" && modal.customer && (
            <CreateCustomerForm
              customer={modal.customer}
              onClose={closeModal}
              onCreated={(updatedCustomer) => {
                setCustomers((prev) =>
                  prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
                );
                showSuccess("Customer updated successfully");
              }}
            />
          )}

          {modal.type === "bulkDelete" && (
            <ConfirmModal
              title="Delete Multiple Customers"
              confirmLabel="Delete All"
              onConfirm={confirmBulkDelete}
              onCancel={closeModal}
            >
              Are you sure you want to delete {modal.count} customer(s)? This action cannot be undone.
            </ConfirmModal>
          )}

          {modal.type && modal.customer && (
            <ConfirmModal
              title={
                modal.type === "deactivate"
                  ? `Deactivate "${modal.customer.name}"?`
                  : `Delete "${modal.customer.name}"?`
              }
              confirmLabel={
                modal.type === "deactivate" ? "Deactivate" : "Delete"
              }
              onConfirm={() =>
                modal.type === "deactivate"
                  ? updateCustomer(modal.customer.id, { active: false }).then(
                      () => {
                        setCustomers((prev) =>
                          prev.map((cust) =>
                            cust.id === modal.customer.id
                              ? { ...cust, active: false }
                              : cust
                          )
                        );
                        showSuccess("Customer deactivated successfully");
                        closeModal();
                      }
                    )
                  : deleteCustomerHandler(modal.customer.id)
              }
              onCancel={closeModal}
            >
              Are you sure you want to{" "}
              {modal.type === "deactivate" ? "deactivate" : "delete"} this
              customer? {modal.type === "delete" && "This action cannot be undone."}
            </ConfirmModal>
          )}

          {showAddressManager && (
            <AddressManager
              customerId={showAddressManager}
              onClose={() => setShowAddressManager(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

function CustomerRow({ 
  serial, 
  customer, 
  selected,
  onToggleSelect,
  onEdit,
  onDeactivate, 
  onActivate,
  onDelete, 
  onManageAddresses 
}) {
  const [expandedAddress1, setExpandedAddress1] = useState(false);
  const [expandedAddress2, setExpandedAddress2] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const limit = 40;
  
  const addresses = customer.addresses || [];
  const address1 = addresses[0]?.formatted || "";
  const address2 = addresses[1]?.formatted || "";

  const AddressCell = ({ address, expanded, setExpanded, isEmpty = false }) => {
    if (isEmpty || !address) {
      return (
        <td className="px-4 py-3 text-gray-400 italic text-center">
          —
        </td>
      );
    }

    return (
      <td className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="flex-1 text-gray-700">
            {address.length > limit && !expanded
              ? `${address.slice(0, limit)}…`
              : address}
          </span>
          {address.length > limit && (
            <button
              className="text-blue-600 hover:text-blue-800 text-xs ml-2 flex-shrink-0 font-medium"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Less" : "More"}
            </button>
          )}
        </div>
      </td>
    );
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 text-center text-gray-700">{serial}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{customer.name}</div>
      </td>
      <td className="px-4 py-3 text-gray-700">{customer.mobile}</td>
      <td className="px-4 py-3 text-gray-700">{customer.email}</td>
      
      <AddressCell 
        address={address1} 
        expanded={expandedAddress1} 
        setExpanded={setExpandedAddress1} 
        isEmpty={!address1}
      />
      
      <AddressCell 
        address={address2} 
        expanded={expandedAddress2} 
        setExpanded={setExpandedAddress2}
        isEmpty={!address2}
      />
      
      <td className="px-4 py-3 text-gray-700">
        {new Date(customer.created_at).toLocaleDateString()}
      </td>

      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          customer.active 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {customer.active ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-gray-600 hover:text-gray-900 font-bold text-lg"
        >
          ⋮
        </button>
        
        {showActions && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowActions(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                onClick={() => {
                  onEdit();
                  setShowActions(false);
                }}
              >
                <span>✏️</span> Edit
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                onClick={() => {
                  onManageAddresses();
                  setShowActions(false);
                }}
              >
                <span>📍</span> Manage Addresses
              </button>
              {customer.active ? (
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-yellow-600 flex items-center gap-2"
                  onClick={() => {
                    onDeactivate();
                    setShowActions(false);
                  }}
                >
                  <span>⏸️</span> Deactivate
                </button>
              ) : (
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600 flex items-center gap-2"
                  onClick={() => {
                    onActivate();
                    setShowActions(false);
                  }}
                >
                  <span>✅</span> Activate
                </button>
              )}
              <hr className="my-1" />
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
              >
                <span>🗑️</span> Delete
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

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
        pages.push(1, 2, 3, 4, "...", pageCount);
      } else if (currentPage >= pageCount - 2) {
        pages.push(1, "...", pageCount - 3, pageCount - 2, pageCount - 1, pageCount);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", pageCount);
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
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 border rounded-lg transition-colors ${
              currentPage === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-gray-50"
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

function ConfirmModal({ title, children, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
        <div className="mb-6 text-gray-600">{children}</div>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${
              confirmLabel === "Delete" || confirmLabel === "Delete All"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-yellow-500 hover:bg-yellow-600 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700"
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-70">{icon}</div>
      </div>
    </div>
  );
}
