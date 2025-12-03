/**
 * Example Controller - Demonstrates best practices
 * This is a template showing how to structure controllers with proper error handling
 */

const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all items with pagination and filtering
 * @route GET /api/items
 * @access Public
 */
exports.getAllItems = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    category,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;

  // Build query
  let query = sql`SELECT * FROM items WHERE 1=1`;

  if (search) {
    const searchTerm = `%${search}%`;
    query = sql`${query} AND (name ILIKE ${searchTerm} OR description ILIKE ${searchTerm})`;
  }

  if (category) {
    query = sql`${query} AND category = ${category}`;
  }

  // Get total count for pagination
  const countQuery = sql`SELECT COUNT(*) as total FROM (${query}) as filtered`;
  const [{ total }] = await countQuery;

  // Add sorting and pagination
  query = sql`${query} ORDER BY ${sql(sortBy)} ${sql.unsafe(sortOrder)} LIMIT ${limit} OFFSET ${offset}`;

  const items = await query;

  // Return paginated response
  ApiResponse.paginated(res, items, {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total)
  }, 'Items fetched successfully');
});

/**
 * Get single item by ID
 * @route GET /api/items/:id
 * @access Public
 */
exports.getItemById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const [item] = await sql`SELECT * FROM items WHERE id = ${id}`;

  if (!item) {
    throw ApiError.notFound(`Item with id ${id} not found`);
  }

  ApiResponse.success(res, item, 'Item fetched successfully');
});

/**
 * Create new item
 * @route POST /api/items
 * @access Private (Admin)
 */
exports.createItem = catchAsync(async (req, res) => {
  const { name, description, category, price } = req.body;

  // Check for duplicates
  const [existing] = await sql`SELECT id FROM items WHERE name = ${name}`;
  
  if (existing) {
    throw ApiError.conflict('Item with this name already exists');
  }

  // Create item
  const [item] = await sql`
    INSERT INTO items (name, description, category, price)
    VALUES (${name}, ${description}, ${category}, ${price})
    RETURNING *
  `;

  ApiResponse.created(res, item, 'Item created successfully');
});

/**
 * Update item
 * @route PUT /api/items/:id
 * @access Private (Admin)
 */
exports.updateItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if item exists
  const [existing] = await sql`SELECT id FROM items WHERE id = ${id}`;
  
  if (!existing) {
    throw ApiError.notFound(`Item with id ${id} not found`);
  }

  // Update item
  const [item] = await sql`
    UPDATE items 
    SET ${sql(updates, ...Object.keys(updates))}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  ApiResponse.success(res, item, 'Item updated successfully');
});

/**
 * Delete item
 * @route DELETE /api/items/:id
 * @access Private (Admin)
 */
exports.deleteItem = catchAsync(async (req, res) => {
  const { id } = req.params;

  const [deleted] = await sql`
    DELETE FROM items WHERE id = ${id} RETURNING id
  `;

  if (!deleted) {
    throw ApiError.notFound(`Item with id ${id} not found`);
  }

  ApiResponse.success(res, null, 'Item deleted successfully');
});

/**
 * Bulk operations example
 * @route POST /api/items/bulk
 * @access Private (Admin)
 */
exports.bulkCreateItems = catchAsync(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Items array is required and must not be empty');
  }

  // Validate all items before inserting
  for (const item of items) {
    if (!item.name || !item.price) {
      throw ApiError.badRequest('Each item must have name and price');
    }
  }

  // Insert all items
  const insertedItems = await sql`
    INSERT INTO items ${sql(items, 'name', 'description', 'category', 'price')}
    RETURNING *
  `;

  ApiResponse.created(res, insertedItems, `${insertedItems.length} items created successfully`);
});

/**
 * Complex query example with joins
 * @route GET /api/items/:id/related
 * @access Public
 */
exports.getRelatedItems = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 5 } = req.query;

  // Get the item first
  const [item] = await sql`SELECT * FROM items WHERE id = ${id}`;

  if (!item) {
    throw ApiError.notFound(`Item with id ${id} not found`);
  }

  // Get related items (same category, excluding current item)
  const relatedItems = await sql`
    SELECT i.*, c.name as category_name
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.category = ${item.category}
    AND i.id != ${id}
    ORDER BY i.created_at DESC
    LIMIT ${limit}
  `;

  ApiResponse.success(res, {
    item,
    related: relatedItems
  }, 'Related items fetched successfully');
});
