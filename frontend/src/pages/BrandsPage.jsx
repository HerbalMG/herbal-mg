import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { createSlug } from '../utils/slugUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/brand`);
      if (!response.ok) throw new Error('Failed to fetch brands');
      
      const data = await response.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Brands', path: '/brands' }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          All Brands
        </h1>
        {!loading && !error && (
          <p className="text-gray-600">
            {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search brands..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Loading brands...</div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Brands</h3>
          <p className="text-red-600 mb-4">
            We're having trouble connecting to our servers. Please try again later.
          </p>
          <p className="text-sm text-gray-600 mb-6">Error: {error}</p>
          <button
            onClick={fetchBrands}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      ) : filteredBrands.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredBrands.map((brand) => (
            <Link
              key={brand.id}
              to={`/brand/${brand.slug || createSlug(brand.name)}`}
              className="group"
            >
              <div className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 text-center">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-16 h-16 mx-auto object-contain mb-2 group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-500 text-xs font-medium">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-sm font-medium text-gray-800 truncate">
                  {brand.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {searchQuery ? `No brands found for "${searchQuery}"` : 'No Brands Available'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or browse all available brands.' 
                : 'We\'re working on adding trusted brands to our platform. Check back soon for quality products from renowned manufacturers!'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandsPage;