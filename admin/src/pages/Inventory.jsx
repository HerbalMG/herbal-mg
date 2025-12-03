import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getProducts, updateProduct, deleteProduct } from '../lib/productApi';
import { getBrands } from '../lib/brandApi';
import Select from 'react-select';

const getStatusBadge = (status) => {
  switch (status) {
    case "In Stock":
      return "bg-green-100 text-green-700 border-green-300";
    case "Low Stock":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "Out of Stock":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "";
  }
};

const getStatusFromQuantity = (total_quantity) => {
  if (total_quantity === 0) return "Out of Stock";
  if (total_quantity < 50) return "Low Stock";
  return "In Stock";
};

const InventoryPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingItem, setEditingItem] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, brandsData] = await Promise.all([
        getProducts(),
        getBrands(),
      ]);
      
      const brandMap = Object.fromEntries(brandsData.map(b => [b.id, b.name]));
      
      const productsWithBrands = productsData.map(product => ({
        ...product,
        brand: brandMap[product.brand_id] || 'Unknown',
        status: getStatusFromQuantity(product.total_quantity || 0)
      }));
      
      setProducts(productsWithBrands);
      setBrands(brandsData);
    } catch (err) {
      setError('Failed to fetch inventory data');
      setProducts([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.status === 'In Stock').length,
    lowStock: products.filter(p => p.status === 'Low Stock').length,
    outOfStock: products.filter(p => p.status === 'Out of Stock').length,
    totalQuantity: products.reduce((sum, p) => sum + (p.total_quantity || 0), 0),
  }), [products]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(id);
      setProducts(products.filter((item) => item.id !== id));
      showSuccess('Product deleted successfully');
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedProducts.length} product(s)?`)) return;
    
    try {
      await Promise.all(selectedProducts.map(id => deleteProduct(id)));
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      showSuccess(`${selectedProducts.length} product(s) deleted successfully`);
    } catch (err) {
      setError('Failed to delete some products');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updatedItem = {
      ...editingItem,
      status: getStatusFromQuantity(editingItem.total_quantity),
    };
    
    try {
      await updateProduct(updatedItem.id, updatedItem);
      setProducts((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      setEditingItem(null);
      showSuccess('Product updated successfully');
    } catch (err) {
      setError('Failed to update product');
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = brandFilter === "All" || item.brand === brandFilter;
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesBrand && matchesCategory && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      const { key, direction } = sortConfig;
      if (!key) return 0;
      const valueA = a[key];
      const valueB = b[key];
      if (valueA < valueB) return direction === "asc" ? -1 : 1;
      if (valueA > valueB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, search, brandFilter, categoryFilter, statusFilter, sortConfig]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedProducts.length === displayedItems.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(displayedItems.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const headers = ['Sr.No', 'Product Name', 'Quantity', 'Status', 'Category', 'Brand'];
      const rows = filteredProducts.map((item, idx) => [
        idx + 1,
        item.name,
        item.total_quantity,
        item.status,
        item.category,
        item.brand
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccess('Inventory exported successfully');
    } catch (err) {
      setError('Failed to export inventory');
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setBrandFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage product inventory</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <span>{loading ? '⟳' : '🔄'}</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportToCSV}
            disabled={exportLoading || filteredProducts.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <span>📊</span>
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Products" value={stats.total} icon="📦" color="blue" />
        <StatCard label="In Stock" value={stats.inStock} icon="✅" color="green" />
        <StatCard label="Low Stock" value={stats.lowStock} icon="⚠️" color="yellow" />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon="❌" color="red" />
        <StatCard label="Total Quantity" value={stats.totalQuantity} icon="📊" color="purple" />
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
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <Select
              options={[
                { value: "All", label: "All Brands" },
                ...brands.map((b) => ({ value: b.name, label: b.name })),
              ]}
              value={{ value: brandFilter, label: brandFilter === "All" ? "All Brands" : brandFilter }}
              onChange={(selected) => {
                setBrandFilter(selected?.value || "All");
                setCurrentPage(1);
              }}
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Unani">Unani</option>
              <option value="Ayurvedic">Ayurvedic</option>
              <option value="Homeopathic">Homeopathic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {(search || brandFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All') && (
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
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            {selectedProducts.length} product(s) selected
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
            <button 
              onClick={() => setSelectedProducts([])}
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
                    checked={selectedProducts.length === displayedItems.length && displayedItems.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Sr. No</th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Product Name
                    {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total_quantity")}
                >
                  <div className="flex items-center gap-1">
                    Quantity
                    {sortConfig.key === "total_quantity" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Availability
                    {sortConfig.key === "status" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Brand</th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📦</span>
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(item.id)}
                        onChange={() => toggleSelectProduct(item.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.total_quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.category}</td>
                    <td className="px-4 py-3 text-gray-700">{item.brand}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
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
          Showing {displayedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
          {filteredProducts.length} entries
        </div>
        <Pagination
          currentPage={currentPage}
          pageCount={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Product</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  type="number"
                  value={editingItem.total_quantity}
                  onChange={(e) => {
                    const total_quantity = Number(e.target.value);
                    setEditingItem({
                      ...editingItem,
                      total_quantity,
                      status: getStatusFromQuantity(total_quantity),
                    });
                  }}
                />
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Availability Status:{" "}
                  <span className={`font-semibold ${
                    getStatusFromQuantity(editingItem.total_quantity) === 'In Stock' ? 'text-green-600' :
                    getStatusFromQuantity(editingItem.total_quantity) === 'Low Stock' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {getStatusFromQuantity(editingItem.total_quantity)}
                  </span>
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
          <span key={`ellipsis-${idx}`} className="px-2">...</span>
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
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-3 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl opacity-70">{icon}</div>
      </div>
    </div>
  );
}

export default InventoryPage;
