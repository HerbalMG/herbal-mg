const sql = require('../config/supabase');
const {
  appendCustomer,
  findCustomerRowIndex,
  updateCustomer,
  deleteCustomerRow,
} = require('../utils/googleSheets');

function generateCustomerId(customer) {
  const date = (customer.created_at || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
  const namePart = (customer.name || '').toUpperCase().replace(/[^A-Z]/g, '').padEnd(3, 'X').slice(0, 3);
  const idPart = String(customer.id).padStart(2, '0');
  return `CUST-${date}-${namePart}${idPart}`;
}

exports.getAllCustomers = async (req, res) => {
  try {
    // First try with address join, fallback to simple query if address table doesn't exist
    let customers;
    try {
      // Get customers with their addresses as separate records
      const customersWithAddresses = await sql`
        SELECT 
          c.*,
          a.id as address_id,
          a.address_line1,
          a.address_line2,
          a.city,
          a.state,
          a.pincode,
          a.country,
          a.is_default,
          ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY a.is_default DESC, a.created_at ASC) as address_rank
        FROM customer c
        LEFT JOIN address a ON c.id = a.customer_id
        ORDER BY c.id DESC, a.is_default DESC, a.created_at ASC
      `;
      
      // Group addresses by customer
      const customerMap = new Map();
      
      customersWithAddresses.forEach(row => {
        if (!customerMap.has(row.id)) {
          customerMap.set(row.id, {
            id: row.id,
            name: row.name,
            email: row.email,
            mobile: row.mobile,
            customer_id: row.customer_id,
            active: row.active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            addresses: []
          });
        }
        
        if (row.address_id) {
          const formattedAddress = `${row.address_line1}, ${row.city}, ${row.state} - ${row.pincode}`;
          customerMap.get(row.id).addresses.push({
            id: row.address_id,
            formatted: formattedAddress,
            is_default: row.is_default,
            rank: row.address_rank
          });
        }
      });
      
      customers = Array.from(customerMap.values());
      
    } catch (joinErr) {
      // Fallback to simple query if address table doesn't exist
      console.log('Address table not available, using simple query');
      customers = await sql`SELECT * FROM customer ORDER BY id DESC`;
      // Add empty addresses array for consistency
      customers = customers.map(customer => ({
        ...customer,
        addresses: []
      }));
    }
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    let customer;
    try {
      [customer] = await sql`
        SELECT 
          c.*,
          COALESCE(
            STRING_AGG(
              CASE 
                WHEN a.is_default THEN CONCAT(a.address_line1, ', ', a.city, ', ', a.state, ' - ', a.pincode)
                ELSE NULL 
              END, 
              '; '
            ),
            STRING_AGG(
              CONCAT(a.address_line1, ', ', a.city, ', ', a.state, ' - ', a.pincode), 
              '; '
            )
          ) as address
        FROM customer c
        LEFT JOIN address a ON c.id = a.customer_id
        WHERE c.id = ${req.params.id}
        GROUP BY c.id
      `;
    } catch (joinErr) {
      // Fallback to simple query if address table doesn't exist
      [customer] = await sql`SELECT * FROM customer WHERE id = ${req.params.id}`;
    }
    if (!customer) return res.status(404).json({ error: 'Not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerByEmail = async (req, res) => {
  try {
    const [customer] = await sql`SELECT * FROM customer WHERE email = ${req.params.email}`;
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCustomerPublic = async (req, res) => {
  const { name, email, mobile, active = true } = req.body;
  
  if (!name || !email || !mobile) {
    return res.status(400).json({ error: 'Name, email, and mobile are required' });
  }
  
  try {
    const [customer] = await sql`
      INSERT INTO customer (name, email, mobile, active)
      VALUES (${name}, ${email}, ${mobile}, ${active})
      RETURNING *`;

    // Generate customer ID (optional)
    const customId = generateCustomerId(customer);
    
    // Try to add customer_id column if it doesn't exist, or skip if it fails
    try {
      await sql`ALTER TABLE customer ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50)`;
      await sql`UPDATE customer SET customer_id = ${customId} WHERE id = ${customer.id}`;
      customer.customer_id = customId;
    } catch (alterErr) {
      console.log('Customer ID column not available, skipping...');
    }

    // Try Google Sheets integration for public creation too
    try {
      await appendCustomer(customer);
      console.log('✅ Public customer added to Google Sheets successfully');
    } catch (sheetsErr) {
      console.error('❌ Google Sheets integration failed for public customer:', sheetsErr.message);
      console.log('Customer created in database but not in Google Sheets');
    }
    
    res.status(201).json(customer);
  } catch (err) {
    console.error('Public customer creation error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createCustomer = async (req, res) => {
  const { name, email, mobile, address, active = true } = req.body;
  
  if (!name || !email || !mobile) {
    return res.status(400).json({ error: 'Name, email, and mobile are required' });
  }
  
  try {
    const [customer] = await sql`
      INSERT INTO customer (name, email, mobile, active)
      VALUES (${name}, ${email}, ${mobile}, ${active})
      RETURNING *`;

    // Generate customer ID (optional, since schema doesn't have customer_id column)
    const customId = generateCustomerId(customer);
    
    // Try to add customer_id column if it doesn't exist, or skip if it fails
    try {
      await sql`ALTER TABLE customer ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50)`;
      await sql`UPDATE customer SET customer_id = ${customId} WHERE id = ${customer.id}`;
      customer.customer_id = customId;
    } catch (alterErr) {
      console.log('Customer ID column not available, skipping...');
    }

    // Note: Address is now handled separately via the address API
    // The admin panel will create address records using POST /api/customer/:id/addresses
    // This keeps the address format consistent with the frontend

    // Try Google Sheets integration, but don't fail if it doesn't work
    try {
      await appendCustomer(customer);
      console.log('✅ Customer added to Google Sheets successfully');
    } catch (sheetsErr) {
      console.error('❌ Google Sheets integration failed:', sheetsErr.message);
      console.log('Customer created in database but not in Google Sheets');
    }
    
    res.status(201).json(customer);
  } catch (err) {
    console.error('Customer creation error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  const { name, email, mobile, active, address } = req.body;
  
  if (!name || !email || !mobile) {
    return res.status(400).json({ error: 'Name, email, and mobile are required' });
  }
  
  try {
    const [customer] = await sql`
      UPDATE customer 
      SET name=${name}, email=${email}, mobile=${mobile}, active=${active}, updated_at=NOW()
      WHERE id=${req.params.id} RETURNING *`;

    if (!customer) return res.status(404).json({ error: 'Not found' });

    // Add address to customer object for Google Sheets
    if (address) {
      customer.address = address;
    }

    // Try Google Sheets integration for updates
    try {
      const rowIndex = await findCustomerRowIndex(customer.customer_id);
      if (rowIndex > 0) {
        await updateCustomer(customer, rowIndex);
        console.log('✅ Customer updated in Google Sheets successfully');
      } else {
        console.log('⚠️ Customer not found in Google Sheets, skipping update');
      }
    } catch (sheetsErr) {
      console.error('❌ Google Sheets update failed:', sheetsErr.message);
      console.log('Customer updated in database but not in Google Sheets');
    }

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const [deleted] = await sql`DELETE FROM customer WHERE id = ${req.params.id} RETURNING *`;
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    const rowIndex = await findCustomerRowIndex(deleted.customer_id);
    if (rowIndex > 0) {
      await deleteCustomerRow(rowIndex);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
