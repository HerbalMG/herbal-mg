import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CategoryFilters from '../components/CategoryFilters'
import Breadcrumb from '../components/Breadcrumb'
import { slugToText, extractIdFromSlug, createBreadcrumb, createSlug } from '../utils/slugUtils'
import { BiAbacus } from "react-icons/bi"
import { categoryService } from '../services/categoryService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



function CategoryPage() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState(null)

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('name')
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Available filter options
  const [brands, setBrands] = useState([])

  useEffect(() => {
    fetchProducts()
    fetchCategoryInfo()
    fetchBrands()
  }, [categorySlug])

  useEffect(() => {
    applyFilters()
  }, [products, selectedBrand, priceRange, sortBy, showOnlyDiscounted, searchQuery])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use mainCategorySlug parameter that backend expects
      const url = `${API_BASE_URL}/product?mainCategorySlug=${categorySlug}`;
      
      console.log('🔄 Fetching products from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Fetched products:', data.length);
      
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchCategoryInfo = async () => {
    try {
      const categoryId = extractIdFromSlug(categorySlug);
      const identifier = categoryId || categorySlug;
      
      // Use categoryService to fetch category data
      const data = await categoryService.getCategoryByIdOrSlug(identifier);
      setCategory(data);
    } catch (err) {
      console.error('Error fetching category info:', err);
      // Create a mock category object from slug if fetch fails
      setCategory({
        name: slugToText(categorySlug),
        slug: categorySlug
      });
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand`)
      if (response.ok) {
        const data = await response.json()
        setBrands(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error fetching brands:', err)
      setBrands([])
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => {
        return (
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query)
        )
      })
    }

    // Brand filter
    if (selectedBrand) {
      console.log('🔍 Filtering by brand:', selectedBrand, typeof selectedBrand);
      filtered = filtered.filter(product => {
        const brandMatch = product.brand_id?.toString() === selectedBrand.toString();
        console.log(`  Product: ${product.name}, brand_id: ${product.brand_id}, match: ${brandMatch}`);
        return brandMatch;
      })
      console.log('✅ Filtered products count:', filtered.length);
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => 
        Number(product.selling_price || 0) >= Number(priceRange.min)
      )
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => 
        Number(product.selling_price || 0) <= Number(priceRange.max)
      )
    }

    // Discount filter
    if (showOnlyDiscounted) {
      filtered = filtered.filter(product => {
        const actualPrice = Number(product.actual_price || 0)
        const sellingPrice = Number(product.selling_price || 0)
        return actualPrice > sellingPrice && sellingPrice > 0
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return Number(a.selling_price || 0) - Number(b.selling_price || 0)
        case 'price_high':
          return Number(b.selling_price || 0) - Number(a.selling_price || 0)
        case 'discount':
          const getDiscount = (product) => {
            const actual = Number(product.actual_price || 0)
            const selling = Number(product.selling_price || 0)
            return actual > selling ? ((actual - selling) / actual) * 100 : 0
          }
          return getDiscount(b) - getDiscount(a)
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

    setFilteredProducts(filtered)
  }

  const clearFilters = () => {
    setSelectedBrand('')
    setPriceRange({ min: '', max: '' })
    setSortBy('name')
    setShowOnlyDiscounted(false)
    setSearchQuery('')
  }

  const getCategoryTitle = () => {
    return category?.name || slugToText(categorySlug);
  }

  const breadcrumbItems = createBreadcrumb('category', categorySlug, getCategoryTitle());

  return (
    <div className="container mx-auto">
      {/* <Breadcrumb items={breadcrumbItems} /> */}
      
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 mb-2">
          {getCategoryTitle()}
        </h1>
        {!error && (
          <p className="text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Mobile Filter Toggle Button */}
      {/* <div className="lg:hidden flex justify-end mb-4">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Filters
        </button>
      </div> */}

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters for Desktop/Tablet */}
        <div className="hidden lg:block lg:w-1/4">
          <CategoryFilters
            brands={brands}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            showOnlyDiscounted={showOnlyDiscounted}
            setShowOnlyDiscounted={setShowOnlyDiscounted}
            clearFilters={clearFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Products Grid Section */}
        <div className="lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
             {/* Mobile Filter Toggle Button */}
                              <div className="lg:hidden flex justify-end">
                                <button
                                  onClick={() => setShowMobileFilters(true)}
                                  className=" text-white px-4 py-2 rounded-md"
                                >
                                  <BiAbacus className='text-black w-7 h-7'/>
                                </button>
                              </div>
            <div className="flex items-center gap-2">
              {/* <label className="text-sm font-medium text-gray-700">Sort by:</label> */}
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

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">Loading {getCategoryTitle()} products...</div>
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
              <div className="text-gray-500 text-lg mb-4">No products found in {getCategoryTitle()}</div>
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
            {/* <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
              onClick={() => setShowMobileFilters(false)}
            >
              ✕
            </button> */}
            <CategoryFilters
              brands={brands}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              showOnlyDiscounted={showOnlyDiscounted}
              setShowOnlyDiscounted={setShowOnlyDiscounted}
              clearFilters={() => {
                clearFilters()
                setShowMobileFilters(false)
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
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
  )
}

export default CategoryPage