const sql = require('../config/supabase');
const {
  appendOrder,
  findOrderRowIndex,
  updateOrder,
} = require('../utils/googleSheets');

exports.getAllOrderItems = async (req, res) => {
  try {
    const items = await sql`SELECT * FROM order_item ORDER BY id DESC`;
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderItemById = async (req, res) => {
  try {
    const [item] = await sql`SELECT * FROM order_item WHERE id = ${req.params.id}`;
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOrderItem = async (req, res) => {
  const { order_id, product_id, quantity, price, customer_name, date, status, items, address, payment_method, notes } = req.body;
  try {
    const [item] = await sql`
      INSERT INTO order_item (order_id, product_id, quantity, price)
      VALUES (${order_id}, ${product_id}, ${quantity}, ${price})
      RETURNING *`;

    // Try Google Sheets integration
    try {
      const orderData = {
        id: item.id,
        customer_name: customer_name || 'Unknown Customer',
        date: date || new Date().toISOString().split('T')[0],
        price: price || 0,
        status: status || 'Ordered',
        items: items || `Product ID: ${product_id}, Qty: ${quantity}`,
        address: address || '',
        payment_method: payment_method || '',
        notes: notes || '',
        created_at: item.created_at
      };
      
      await appendOrder(orderData);
      console.log('✅ Order added to Google Sheets successfully');
    } catch (sheetsErr) {
      console.error('❌ Google Sheets integration failed for order:', sheetsErr.message);
      console.log('Order created in database but not in Google Sheets');
    }

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderItem = async (req, res) => {
  const { order_id, product_id, quantity, price, customer_name, date, status, items, address, payment_method, notes } = req.body;
  try {
    const [item] = await sql`
      UPDATE order_item
      SET order_id = ${order_id},
          product_id = ${product_id},
          quantity = ${quantity},
          price = ${price},
          updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *`;
    if (!item) return res.status(404).json({ error: 'Not found' });

    // Try Google Sheets integration for updates
    try {
      const orderData = {
        id: item.id,
        customer_name: customer_name || 'Unknown Customer',
        date: date || new Date().toISOString().split('T')[0],
        price: price || 0,
        status: status || 'Ordered',
        items: items || `Product ID: ${product_id}, Qty: ${quantity}`,
        address: address || '',
        payment_method: payment_method || '',
        notes: notes || '',
        updated_at: item.updated_at
      };
      
      const rowIndex = await findOrderRowIndex(item.id);
      if (rowIndex > 0) {
        await updateOrder(orderData, rowIndex);
        console.log('✅ Order updated in Google Sheets successfully');
      } else {
        // If not found in sheets, add it
        await appendOrder(orderData);
        console.log('✅ Order added to Google Sheets (was missing)');
      }
    } catch (sheetsErr) {
      console.error('❌ Google Sheets update failed for order:', sheetsErr.message);
      console.log('Order updated in database but not in Google Sheets');
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrderItem = async (req, res) => {
  try {
    const [deleted] = await sql`
      DELETE FROM order_item WHERE id = ${req.params.id}
      RETURNING *`;
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
