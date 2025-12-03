// Debug version of categoryService with detailed logging

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

console.log('🔧 CategoryService Debug Info:');
console.log('  API_BASE_URL:', API_BASE_URL);
console.log('  Full URL:', `${API_BASE_URL}/category`);
console.log('  VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL);

export const categoryService = {
  async getAllCategories() {
    console.log('📡 Fetching categories from:', `${API_BASE_URL}/category`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Raw data from backend:', data);
      console.log('📊 Number of categories:', data.length);
      
      // Transform backend data to match frontend expectations
      const transformed = data.map(category => {
        const result = {
          id: category.id,
          name: category.name,
          title: category.name,
          slug: category.slug,
          imageUrl: category.image_url || null,
          image_url: category.image_url || null,
          created_at: category.created_at,
          updated_at: category.updated_at
        };
        console.log('🔄 Transformed category:', result);
        return result;
      });
      
      console.log('✅ Returning transformed data:', transformed);
      return transformed;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  async getCategoryByIdOrSlug(identifier) {
    console.log('📡 Fetching category:', identifier);
    
    try {
      const response = await fetch(`${API_BASE_URL}/category/${identifier}`);
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }
      
      const category = await response.json();
      console.log('✅ Raw category data:', category);
      
      const transformed = {
        id: category.id,
        name: category.name,
        title: category.name,
        slug: category.slug,
        imageUrl: category.image_url || null,
        image_url: category.image_url || null,
        created_at: category.created_at,
        updated_at: category.updated_at
      };
      
      console.log('✅ Returning transformed category:', transformed);
      return transformed;
    } catch (error) {
      console.error('❌ Error fetching category:', error);
      throw error;
    }
  }
};
