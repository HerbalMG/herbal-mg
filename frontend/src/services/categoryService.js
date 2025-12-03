const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const categoryService = {
  /**
   * Fetch all main categories from the backend
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/category`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform backend data to match frontend expectations
      return data.map(category => ({
        id: category.id,
        name: category.name,
        title: category.name, // Alias for compatibility
        slug: category.slug,
        imageUrl: category.image_url || null,
        image_url: category.image_url || null, // Keep both for compatibility
        created_at: category.created_at,
        updated_at: category.updated_at
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Fetch a single category by ID or slug
   * @param {string|number} identifier - Category ID or slug
   * @returns {Promise<Object>} Category object
   */
  async getCategoryByIdOrSlug(identifier) {
    try {
      const response = await fetch(`${API_BASE_URL}/category/${identifier}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }
      
      const category = await response.json();
      
      // Transform backend data to match frontend expectations
      return {
        id: category.id,
        name: category.name,
        title: category.name,
        slug: category.slug,
        imageUrl: category.image_url || null,
        image_url: category.image_url || null,
        created_at: category.created_at,
        updated_at: category.updated_at
      };
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }
};
