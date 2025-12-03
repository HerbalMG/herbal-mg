const sql = require('../config/supabase');

// Generate custom order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HERB-${timestamp}-${random}`;
};

async function createOrder(req, res) {
  try {
    const {
      customer_id,
      total_amount,
      payment_status,
      payment_method,
      transaction_id,
      shipping_address,
      delivery_option,
      order_notes,
      prescription_url,
      items
    } = req.body;

    // Determine customer_id: use from body if admin, or from req.user if customer
    let finalCustomerId = customer_id;
    
    // If customer is placing order themselves, use their ID from token
    if (req.user && req.user.type === 'customer') {
      finalCustomerId = req.user.id;
    }
    
    // Validate required fields
    if (!finalCustomerId) {
      return res.status(400).json({ error: 'Customer ID is required. Please login to place an order.' });
    }
    
    if (!total_amount || !shipping_address) {
      return res.status(400).json({ error: 'Missing required fields: total_amount and shipping_address' });
    }
    
    console.log('Creating order for customer:', finalCustomerId, 'by user:', req.user?.type);

    // Format address for storage
    const addressString = typeof shipping_address === 'string' 
      ? shipping_address 
      : JSON.stringify(shipping_address);

    // Generate custom order ID
    const orderId = generateOrderId();

    // Create order (require customer_id)
    const [order] = await sql`
      INSERT INTO "order" (
        id,
        customer_id,
        total_amount,
        address,
        notes,
        prescription_url,
        status
      ) VALUES (
        ${orderId},
        ${finalCustomerId},
        ${total_amount},
        ${addressString},
        ${order_notes || null},
        ${prescription_url || null},
        'Ordered'
      )
      RETURNING *
    `;

    // Create payment record (optional - only if transaction_id provided)
    if (transaction_id) {
      try {
        await sql`
          INSERT INTO payment (
            order_id,
            amount,
            method
          ) VALUES (
            ${order.id},
            ${total_amount},
            ${payment_method || 'test_payment'}
          )
        `;
      } catch (paymentErr) {
        console.error('Payment record creation error:', paymentErr);
        // Continue even if payment record fails - order is already created
      }
    }

    // Create order items
    if (items && items.length > 0) {
      for (const item of items) {
        try {
          await sql`
            INSERT INTO order_item (
              order_id,
              product_id,
              quantity,
              price
            ) VALUES (
              ${order.id},
              ${item.product_id},
              ${item.quantity},
              ${item.price}
            )
          `;
        } catch (itemErr) {
          console.error('Order item creation error:', itemErr);
          // Continue with other items
        }
      }
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    
    const [order] = await sql`
      SELECT * FROM "order" WHERE id = ${id}
    `;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = await sql`
      SELECT 
        oi.*,
        p.name as product_name,
        p.images[1] as product_image
      FROM order_item oi
      LEFT JOIN product p ON oi.product_id = p.id
      WHERE oi.order_id = ${id}
    `;

    res.json({ ...order, items });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getAllOrders(req, res) {
  try {
    console.log('Fetching all orders for admin');
    
    // Fetch orders with customer info
    const orders = await sql`
      SELECT 
        o.*,
        c.name as customer_name,
        c.mobile as customer_mobile,
        c.email as customer_email
      FROM "order" o
      LEFT JOIN customer c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
    `.catch(err => {
      console.error('Error fetching orders:', err);
      throw new Error(`Database query failed: ${err.message}`);
    });

    console.log('Found orders:', orders.length);

    // If no orders, return empty array
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        try {
          const items = await sql`
            SELECT 
              oi.*,
              p.name as product_name,
              p.images[1] as product_image
            FROM order_item oi
            LEFT JOIN product p ON oi.product_id = p.id
            WHERE oi.order_id = ${order.id}
          `.catch(err => {
            console.error('Error fetching items for order:', order.id, err);
            return [];
          });
          
          return { ...order, items: items || [] };
        } catch (itemErr) {
          console.error('Error processing items for order:', order.id, itemErr);
          return { ...order, items: [] };
        }
      })
    );

    console.log('Returning orders with items:', ordersWithItems.length);
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Get all orders error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to fetch orders', 
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

async function getCustomerOrders(req, res) {
  try {
    const { customerId } = req.params;
    
    console.log('Fetching orders for customer:', customerId);
    
    const orders = await sql`
      SELECT * FROM "order" 
      WHERE customer_id = ${parseInt(customerId)}
      ORDER BY order_date DESC
    `;

    console.log('Found orders:', orders.length);

    // If no orders, return empty array
    if (orders.length === 0) {
      return res.json([]);
    }

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        try {
          const items = await sql`
            SELECT 
              oi.*,
              p.name as product_name,
              p.images[1] as product_image
            FROM order_item oi
            LEFT JOIN product p ON oi.product_id = p.id
            WHERE oi.order_id = ${order.id}
          `;
          return { ...order, items: items || [] };
        } catch (itemErr) {
          console.error('Error fetching items for order:', order.id, itemErr);
          return { ...order, items: [] };
        }
      })
    );

    console.log('Returning orders with items:', ordersWithItems.length);
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Get customer orders error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: err.message, details: err.stack });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, replacement_image, notes } = req.body;

    console.log('Updating order status:', id, 'to', status);

    // Validate status
    const validStatuses = ['Ordered', 'Shipped', 'Delivered', 'Replacement', 'Refunded', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current order
    const [currentOrder] = await sql`SELECT * FROM "order" WHERE id = ${id}`;
    
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status with optional replacement_image and notes
    const [order] = await sql`
      UPDATE "order"
      SET 
        status = ${status},
        replacement_image = ${replacement_image !== undefined ? replacement_image : currentOrder.replacement_image},
        notes = ${notes !== undefined ? notes : currentOrder.notes},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order status updated successfully');
    res.json(order);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const { status, notes, address, total_amount, replacement_image } = req.body;

    console.log('Updating order:', id, 'with data:', req.body);

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (status !== undefined) {
      const validStatuses = ['Ordered', 'Shipped', 'Delivered', 'Replacement', 'Refunded', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push('status');
      values.push(status);
    }

    if (notes !== undefined) {
      updates.push('notes');
      values.push(notes);
    }

    if (address !== undefined) {
      updates.push('address');
      values.push(typeof address === 'string' ? address : JSON.stringify(address));
    }

    if (total_amount !== undefined) {
      updates.push('total_amount');
      values.push(total_amount);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Always update updated_at
    updates.push('updated_at');
    values.push(new Date());

    // Build SQL query
    const setClause = updates.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
    values.push(id); // Add id as last parameter

    // Get current order first (id is UUID, don't parse as int)
    const [currentOrder] = await sql`SELECT * FROM "order" WHERE id = ${id}`;
    
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update with proper postgres template literals
    const [order] = await sql`
      UPDATE "order"
      SET 
        status = ${status !== undefined ? status : currentOrder.status},
        notes = ${notes !== undefined ? notes : currentOrder.notes},
        address = ${address !== undefined ? (typeof address === 'string' ? address : JSON.stringify(address)) : currentOrder.address},
        total_amount = ${total_amount !== undefined ? total_amount : currentOrder.total_amount},
        replacement_image = ${replacement_image !== undefined ? replacement_image : currentOrder.replacement_image},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order updated successfully');
    res.json(order);
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function deleteOrder(req, res) {
  try {
    const { id } = req.params;

    console.log('Deleting order:', id);

    // First delete order items
    await sql`
      DELETE FROM order_item
      WHERE order_id = ${id}
    `;

    // Then delete the order
    const [order] = await sql`
      DELETE FROM "order"
      WHERE id = ${id}
      RETURNING *
    `;

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order deleted successfully');
    res.json({ message: 'Order deleted successfully', order });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  getCustomerOrders,
  updateOrderStatus,
  updateOrder,
  deleteOrder
};
