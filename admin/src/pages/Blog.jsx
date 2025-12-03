import React, { useState, useEffect, useMemo, useCallback } from 'react';
import BlogEditor from '../components/BlogEditor';
import BlogReader from '../components/BlogReader'; 
import { getBlogs, createBlog, updateBlog, deleteBlog } from '../lib/blogApi';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [editingBlog, setEditingBlog] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedBlogs, setSelectedBlogs] = useState([]);

  const [deleteId, setDeleteId] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);


  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogs();
      console.log('Fetched blogs:', data);
      if (data.length > 0) {
        console.log('Sample blog structure:', data[0]);
      }
      setBlogs(data);
    } catch (err) {
      setError('Failed to fetch blogs');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const allTags = useMemo(() => {
    const tags = new Set();
    blogs.forEach(blog => {
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [blogs]);

  const stats = useMemo(() => ({
    total: blogs.length,
    published: blogs.filter(b => b.published !== false).length,
    drafts: blogs.filter(b => b.published === false).length,
    thisMonth: blogs.filter(b => {
      const date = new Date(b.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  }), [blogs]);

  const filteredBlogs = useMemo(() => {
    let result = blogs;

    // Search filter
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(blog =>
        blog.title.toLowerCase().includes(term) ||
        blog.des?.toLowerCase().includes(term) ||
        blog.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Tag filter
    if (tagFilter !== 'All') {
      result = result.filter(blog => blog.tags?.includes(tagFilter));
    }

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [blogs, search, tagFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSave = async (blog) => {
    const payload = {
      image_url: blog.banner,
      title: blog.title || '',
      short_description: blog.des || '',
      content: JSON.stringify(blog.content),
      tags: Array.isArray(blog.tags) ? blog.tags.map(String) : [],
    };
    
    if (!payload.title.trim() || !blog.content || !blog.content.blocks || blog.content.blocks.length === 0) {
      setError('Title and content are required.');
      return;
    }
    
    try {
      let updatedBlogs;
      if (editingBlog) {
        const updated = await updateBlog(blog.id, payload);
        updatedBlogs = blogs.map((b) => (b.id === blog.id ? updated : b));
        showSuccess('Blog updated successfully');
      } else {
        const created = await createBlog(payload);
        updatedBlogs = [created, ...blogs];
        showSuccess('Blog created successfully');
      }
      setBlogs(updatedBlogs);
      setShowEditor(false);
      setEditingBlog(null);
    } catch (err) {
      setError('Failed to save blog');
    }
  };

  const handleEdit = (blog) => {
    console.log('Editing blog:', blog);
    
    // Parse content if it's a string
    let parsedBlog = { ...blog };
    if (typeof blog.content === 'string') {
      try {
        parsedBlog.content = JSON.parse(blog.content);
      } catch (err) {
        console.error('Failed to parse blog content:', err);
        parsedBlog.content = { blocks: [] };
      }
    }
    
    // Ensure content has the right structure
    if (!parsedBlog.content || !parsedBlog.content.blocks) {
      parsedBlog.content = { blocks: [] };
    }
    
    // Map backend field names to editor format
    parsedBlog.banner = parsedBlog.banner || parsedBlog.image_url || '';
    parsedBlog.des = parsedBlog.des || parsedBlog.short_description || '';
    parsedBlog.title = parsedBlog.title || '';
    parsedBlog.tags = Array.isArray(parsedBlog.tags) ? parsedBlog.tags : [];
    
    console.log('Parsed blog for editing:', parsedBlog);
    
    setEditingBlog(parsedBlog);
    setShowEditor(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteBlog(deleteId);
      setBlogs(blogs.filter((b) => b.id !== deleteId));
      showSuccess('Blog deleted successfully');
    } catch (err) {
      setError('Failed to delete blog');
    } finally {
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsModalOpen(false);
    setDeleteId(null);
  };


  // const handleDelete = async (id) => {
  //   if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
  //   try {
  //     await deleteBlog(id);
  //     setBlogs(blogs.filter((b) => b.id !== id));
  //     showSuccess('Blog deleted successfully');
  //   } catch (err) {
  //     setError('Failed to delete blog');
  //   }
  // };

  // const handleBulkDelete = async () => {
  //   if (!window.confirm(`Delete ${selectedBlogs.length} blog(s)?`)) return;
    
  //   try {
  //     await Promise.all(selectedBlogs.map(id => deleteBlog(id)));
  //     setBlogs(prev => prev.filter(b => !selectedBlogs.includes(b.id)));
  //     setSelectedBlogs([]);
  //     showSuccess(`${selectedBlogs.length} blog(s) deleted successfully`);
  //   } catch (err) {
  //     setError('Failed to delete some blogs');
  //   }
  // };

  const handleNew = () => {
    setEditingBlog(null);
    setShowEditor(true);
  };

  // const toggleSelectBlog = (id) => {
  //   setSelectedBlogs(prev =>
  //     prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
  //   );
  // };

  const clearFilters = () => {
    setSearch('');
    setTagFilter('All');
    setCurrentPage(1);
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blogs...</p>
        </div>
      </div>
    );
  }

  if (selectedBlog) {
    return <BlogReader blog={selectedBlog} onBack={() => setSelectedBlog(null)} />;
  }

  if (showEditor) {
    return (
      <BlogEditor
        blog={editingBlog || {}}
        onSave={handleSave}
        onCancel={() => {
          setShowEditor(false);
          setEditingBlog(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete blog?</h3>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The blog will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Blog Management</h1>
          <p className="text-gray-600 mt-1">Create and manage blog posts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchBlogs}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            <span>{loading ? '⟳' : '🔄'}</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleNew}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <span>+</span>
            New Blog
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Blogs" value={stats.total} icon="📝" color="blue" />
        <StatCard label="Published" value={stats.published} icon="✅" color="green" />
        <StatCard label="Drafts" value={stats.drafts} icon="📄" color="gray" />
        <StatCard label="This Month" value={stats.thisMonth} icon="📅" color="purple" />
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
              placeholder="Search by title, description, or tags..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
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
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          {(search || tagFilter !== 'All') && (
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
      {/* {selectedBlogs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            {selectedBlogs.length} blog(s) selected
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
            <button 
              onClick={() => setSelectedBlogs([])}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )} */}

      {/* Blog Grid */}
      {paginatedBlogs.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border">
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl">📝</span>
            <p className="text-xl font-medium text-gray-700">No blogs found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or create a new blog</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBlogs.map((blog) => (
            <div key={blog.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow border">
              {/* Selection Checkbox */}
              {/* <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedBlogs.includes(blog.id)}
                  onChange={() => toggleSelectBlog(blog.id)}
                  className="w-5 h-5 cursor-pointer"
                />
              </div> */}

              {/* Banner Image */}
              {(blog.banner || blog.image_url) && (
                <img
                  src={blog.banner || blog.image_url}
                  alt={blog.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedBlog(blog)}
                />
              )}

              <div className="p-4">
                {/* Title */}
                <h3 
                  className="font-bold text-lg mb-2 text-gray-800 cursor-pointer hover:text-blue-600 line-clamp-2"
                  onClick={() => setSelectedBlog(blog)}
                >
                  {blog.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{blog.des || blog.short_description || ''}</p>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{blog.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="text-xs text-gray-400 mb-3">
                  {blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    onClick={() => setSelectedBlog(blog)}
                  >
                    Read
                  </button>
                  <button
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    onClick={() => handleEdit(blog)}
                  >
                    Edit
                  </button>
                  <button
                    className=" text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    onClick={() => handleDelete(blog.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredBlogs.length)} of{' '}
            {filteredBlogs.length} blogs
          </div>
          <Pagination
            currentPage={currentPage}
            pageCount={totalPages}
            onPageChange={setCurrentPage}
          />
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
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
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

export default Blog;
