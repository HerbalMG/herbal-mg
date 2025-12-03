import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import { slugToText, extractIdFromSlug } from '../utils/slugUtils';
import { BiAbacus } from "react-icons/bi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const BrandProducts = () => {
  const { brandSlug } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Available filter options
  const [diseases, setDiseases] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchBrandInfo();
    fetchDiseases();
  }, [brandSlug]);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedDisease, priceRange, sortBy, showOnlyDiscounted]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to extract ID from slug, otherwise use slug as brand name
      const brandId = extractIdFromSlug(brandSlug);
      const brandName = slugToText(brandSlug.replace(`-${brandId}`, ''));
      
      let url = `${API_BASE_URL}/product`;
      if (brandId) {
        url += `?brandId=${brandId}`;
      } else {
        // Try with slug first, then fallback to name
        url += `?brandSlug=${brandSlug}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        // Fallback to brand name if slug doesn't work
        if (!brandId) {
          const fallbackUrl = `${API_BASE_URL}/product?brand=${encodeURIComponent(brandName)}`;
          const fallbackResponse = await fetch(fallbackUrl);
          if (!fallbackResponse.ok) throw new Error('Failed to fetch products');
          const data = await fallbackResponse.json();
          setProducts(Array.isArray(data) ? data : []);
          return;
        }
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandInfo = async () => {
    try {
      const brandId = extractIdFromSlug(brandSlug);
      console.log('Fetching brand info for:', { brandSlug, brandId });
      
      if (brandId) {
        // Try to fetch by ID first
        console.log('Fetching brand by ID:', brandId);
        const response = await fetch(`${API_BASE_URL}/brand/${brandId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Brand data fetched by ID:', data);
          setBrand(data);
          return;
        } else {
          console.log('Failed to fetch brand by ID, status:', response.status);
        }
      }
      
      // Try to fetch by slug
      console.log('Fetching brand by slug:', brandSlug);
      const slugResponse = await fetch(`${API_BASE_URL}/brand/slug/${brandSlug}`);
      if (slugResponse.ok) {
        const data = await slugResponse.json();
        console.log('Brand data fetched by slug:', data);
        setBrand(data);
      } else {
        console.log('Failed to fetch brand by slug, status:', slugResponse.status);
        
        // Fallback: fetch all brands and find matching one
        try {
          console.log('Trying fallback: fetching all brands');
          const allBrandsResponse = await fetch(`${API_BASE_URL}/brand`);
          if (allBrandsResponse.ok) {
            const allBrands = await allBrandsResponse.json();
            console.log('All brands fetched:', allBrands.length);
            
            // Try to find brand by name match
            const brandName = slugToText(brandSlug);
            const matchingBrand = allBrands.find(b => 
              b.name.toLowerCase() === brandName.toLowerCase() ||
              b.name.toLowerCase().includes(brandName.toLowerCase())
            );
            
            if (matchingBrand) {
              console.log('Found matching brand:', matchingBrand);
              setBrand(matchingBrand);
            } else {
              console.log('No matching brand found, using mock');
              setBrand({
                name: brandName,
                slug: brandSlug
              });
            }
          } else {
            throw new Error('Failed to fetch all brands');
          }
        } catch (fallbackErr) {
          console.error('Fallback failed:', fallbackErr);
          // Create a mock brand object from slug
          const mockBrand = {
            name: slugToText(brandSlug),
            slug: brandSlug
          };
          console.log('Using mock brand:', mockBrand);
          setBrand(mockBrand);
        }
      }
    } catch (err) {
      console.error('Error fetching brand info:', err);
      const fallbackBrand = {
        name: slugToText(brandSlug),
        slug: brandSlug
      };
      console.log('Using fallback brand:', fallbackBrand);
      setBrand(fallbackBrand);
    }
  };

  const fetchDiseases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/disease`);
      if (response.ok) {
        const data = await response.json();
        setDiseases(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching diseases:', err);
      setDiseases([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      console.log('🔍 Searching for:', searchQuery);
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.key?.toLowerCase().includes(query)
        );
      });
      console.log('✅ Search results:', filtered.length);
    }

    // Disease filter
    if (selectedDisease) {
      console.log('🔍 Filtering by disease:', selectedDisease);
      const diseaseQuery = selectedDisease.toString().toLowerCase();
      filtered = filtered.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(diseaseQuery);
        const descMatch = product.description?.toLowerCase().includes(diseaseQuery);
        const keyMatch = product.key?.toLowerCase().includes(diseaseQuery);
        return nameMatch || descMatch || keyMatch;
      });
      console.log('✅ Disease filter results:', filtered.length);
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => 
        Number(product.selling_price || 0) >= Number(priceRange.min)
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => 
        Number(product.selling_price || 0) <= Number(priceRange.max)
      );
    }

    // Discount filter
    if (showOnlyDiscounted) {
      filtered = filtered.filter(product => {
        const actualPrice = Number(product.actual_price || 0);
        const sellingPrice = Number(product.selling_price || 0);
        return actualPrice > sellingPrice && sellingPrice > 0;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return Number(a.selling_price || 0) - Number(b.selling_price || 0);
        case 'price_high':
          return Number(b.selling_price || 0) - Number(a.selling_price || 0);
        case 'discount':
          const getDiscount = (product) => {
            const actual = Number(product.actual_price || 0);
            const selling = Number(product.selling_price || 0);
            return actual > selling ? ((actual - selling) / actual) * 100 : 0;
          };
          return getDiscount(b) - getDiscount(a);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDisease('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
    setShowOnlyDiscounted(false);
  };

  const getBrandTitle = () => {
    return brand?.name || slugToText(brandSlug);
  };

  return (
    <div className="container mx-auto">
      {brand?.banner_url && (
        <div className="mb-4">
          <img
            src={brand.banner_url}
            alt={`${brand.name} banner`}
            className="w-full h-34 sm:h-48 md:h-48 object-cover rounded-md shadow"
          />
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
          {getBrandTitle()} Products
        </h1>
        {!error && (
          <p className="text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Main Layout with Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters for Desktop/Tablet */}
        <div className="hidden lg:block lg:w-1/4">
          <ProductFilters
            brands={[]} // No brand filter needed on brand page
            diseases={diseases}
            selectedBrand=""
            setSelectedBrand={() => {}}
            selectedDisease={selectedDisease}
            setSelectedDisease={setSelectedDisease}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            showOnlyDiscounted={showOnlyDiscounted}
            setShowOnlyDiscounted={setShowOnlyDiscounted}
            clearFilters={clearFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            hideBrandFilter={true}
          />
        </div>

        {/* Products Grid Section */}
        <div className="lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden flex justify-end">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="text-white px-4 py-2 rounded-md"
              >
                <BiAbacus className='text-black w-7 h-7'/>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price_low">Price (Low to High)</option>
                <option value="price_high">Price (High to Low)</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">Loading {getBrandTitle()} products...</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Unable to Load Products</h3>
              <p className="text-red-600 mb-4">
                We're having trouble connecting to our servers. Please try again later.
              </p>
              <p className="text-sm text-gray-600 mb-6">Error: {error}</p>
              <button
                onClick={fetchProducts}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                No products found {searchQuery || selectedDisease ? 'matching your filters' : `for ${getBrandTitle()}`}
              </div>
              <p className="text-gray-400 mb-6">
                Try adjusting your filters or search criteria
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start pt-12">
          <div className="bg-white w-11/12 max-w-md p-6 rounded-lg shadow-lg relative">
            <ProductFilters
              brands={[]}
              diseases={diseases}
              selectedBrand=""
              setSelectedBrand={() => {}}
              selectedDisease={selectedDisease}
              setSelectedDisease={setSelectedDisease}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              showOnlyDiscounted={showOnlyDiscounted}
              setShowOnlyDiscounted={setShowOnlyDiscounted}
              clearFilters={() => {
                clearFilters();
                setShowMobileFilters(false);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              hideBrandFilter={true}
            />
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandProducts;