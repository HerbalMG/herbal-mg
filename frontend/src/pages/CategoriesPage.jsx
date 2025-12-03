import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching categories from:', `${API_BASE_URL}/category`);
      const response = await fetch(`${API_BASE_URL}/category`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched categories:', data.length);
      
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else {
        throw new Error('No categories available');
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError(err.message);
      // Use fallback data
      setCategories([
        { id: 1, name: "Diabetes", slug: "diabetes", image_url: "/assets/diabetes.svg" },
        { id: 2, name: "Skin Care", slug: "skin-care", image_url: "/assets/skin.svg" },
        { id: 3, name: "Hair Care", slug: "hair-care", image_url: "/assets/hair.svg" },
        { id: 4, name: "Joint, Bone & Muscle Care", slug: "muscle-care", image_url: "/assets/joint.svg" },
        { id: 5, name: "Kidney Care", slug: "kidney-care", image_url: "/assets/Kidney.svg" },
        { id: 6, name: "Liver Care", slug: "liver-care", image_url: "/assets/liver.svg" },
        { id: 7, name: "Heart Care", slug: "heart-care", image_url: "/assets/heart.svg" },
        { id: 8, name: "Men Wellness", slug: "men-wellness", image_url: "/assets/men.svg" },
        { id: 9, name: "Women Wellness", slug: "women-wellness", image_url: "/assets/women.svg" },
        { id: 10, name: "Digestive Care", slug: "digestive-care", image_url: "/assets/digestive.svg" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          All Categories
        </h1>
        {!loading && (
          <p className="text-gray-600">
            {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'} found
          </p>
        )}
      </div>

      {/* Error Banner */}
      {error && !loading && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Connection Issue:</span> Unable to load categories from server. Showing default categories.
              </p>
              <button
                onClick={fetchCategories}
                className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Loading categories...</div>
          </div>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCategories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="group"
            >
              <div className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 text-center">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-16 h-16 mx-auto object-contain mb-2 group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-500 text-xs font-medium">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-sm font-medium text-gray-800 text-center">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {searchQuery ? `No Categories Found for "${searchQuery}"` : 'No Categories Available'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or browse all available categories.' 
                : 'We\'re organizing our product categories. Check back soon for a better shopping experience!'
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

export default CategoriesPage;
