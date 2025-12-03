const getSheetsClient = require('../config/googleSheets');

const SPREADSHEET_ID = '131HPWm3xMiKbbBRAFBDhHQ35NPDhsik2VDeCd0vUC5A'; // Your actual sheet ID

async function ensureCustomerHeaders() {
  try {
    const sheets = await getSheetsClient();
    
    // Check if headers exist
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Customers!A1:H1',
    });
    
    const headers = ['Customer ID', 'Name', 'Email', 'Mobile', 'Address 1', 'Address 2', 'Status', 'Created At'];
    
    if (!existingData.data.values || existingData.data.values.length === 0) {
      // Add headers if they don't exist
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Customers!A1:H1',
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      console.log('✅ Added headers to Customers sheet');
    } else {
      console.log('📋 Headers already exist in Customers sheet');
    }
  } catch (error) {
    console.log('⚠️ Could not ensure headers:', error.message);
  }
}

async function ensureOrderHeaders() {
  try {
    const sheets = await getSheetsClient();
    
    // Check if headers exist
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A1:J1',
    });
    
    const headers = ['Order ID', 'Customer Name', 'Date', 'Price (₹)', 'Status', 'Items', 'Address', 'Payment Method', 'Notes', 'Created At'];
    
    if (!existingData.data.values || existingData.data.values.length === 0) {
      // Add headers if they don't exist
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Orders!A1:J1',
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      console.log('✅ Added headers to Orders sheet');
    } else {
      console.log('📋 Headers already exist in Orders sheet');
    }
  } catch (error) {
    console.log('⚠️ Could not ensure Orders headers:', error.message);
  }
}

async function ensureInventoryHeaders() {
  try {
    const sheets = await getSheetsClient();
    
    // Check if headers exist
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A1:H1',
    });
    
    const headers = ['Product Name', 'Quantity', 'Availability', 'Category', 'Brand', 'Price (₹)', 'Last Updated', 'Status'];
    
    if (!existingData.data.values || existingData.data.values.length === 0) {
      // Add headers if they don't exist
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Inventory!A1:H1',
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
      console.log('✅ Added headers to Inventory sheet');
    } else {
      console.log('📋 Headers already exist in Inventory sheet');
    }
  } catch (error) {
    console.log('⚠️ Could not ensure Inventory headers:', error.message);
  }
}

async function getSheetIdByName(sheetName) {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
  return sheet.properties.sheetId;
}

async function appendCustomer(customer) {
  try {
    console.log('📊 Attempting to add customer to Google Sheets:', customer.name);
    
    // Ensure headers exist first
    await ensureCustomerHeaders();
    
    const sheets = await getSheetsClient();
    
    // Parse address into address1 and address2 if it's a single string
    let address1 = '';
    let address2 = '';
    
    if (customer.address) {
      const addressParts = customer.address.split(',');
      address1 = addressParts[0]?.trim() || '';
      address2 = addressParts.slice(1).join(',').trim() || '';
    } else if (customer.address_line1) {
      address1 = customer.address_line1 || '';
      address2 = customer.address_line2 || '';
    }
    
    // Format createdAt date
    const createdAt = customer.created_at ? 
      new Date(customer.created_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const values = [
      customer.customer_id || '',
      customer.name || '',
      customer.email || '',
      customer.mobile || '',
      address1,
      address2,
      customer.active ? 'Active' : 'Inactive',
      createdAt
    ];
    
    console.log('📝 Data to append:', values);
    
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Customers!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
    
    console.log('✅ Successfully added customer to Google Sheets');
    console.log('📊 Sheets response:', result.data);
    return result;
  } catch (error) {
    console.error('❌ Error in appendCustomer:', error.message);
    console.error('📋 Error details:', error);
    throw error;
  }
}

async function findCustomerRowIndex(customer_id) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Customers!A:A',
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === customer_id) return i + 1;
  }
  return -1;
}

async function updateCustomer(customer, rowIndex) {
  try {
    console.log('📊 Updating customer in Google Sheets:', customer.name);
    const sheets = await getSheetsClient();
    
    // Parse address into address1 and address2 if it's a single string
    let address1 = '';
    let address2 = '';
    
    if (customer.address) {
      const addressParts = customer.address.split(',');
      address1 = addressParts[0]?.trim() || '';
      address2 = addressParts.slice(1).join(',').trim() || '';
    } else if (customer.address_line1) {
      address1 = customer.address_line1 || '';
      address2 = customer.address_line2 || '';
    }
    
    // Format updatedAt date
    const updatedAt = customer.updated_at ? 
      new Date(customer.updated_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const values = [
      customer.customer_id || '',
      customer.name || '',
      customer.email || '',
      customer.mobile || '',
      address1,
      address2,
      customer.active ? 'Active' : 'Inactive',
      updatedAt
    ];
    
    console.log('📝 Data to update:', values);
    
    const range = `Customers!A${rowIndex}:H${rowIndex}`;
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    
    console.log('✅ Successfully updated customer in Google Sheets');
    return result;
  } catch (error) {
    console.error('❌ Error in updateCustomer:', error.message);
    throw error;
  }
}

async function deleteCustomerRow(rowIndex) {
  const sheets = await getSheetsClient();
  const sheetId = await getSheetIdByName('Customers');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

// Orders functions
async function appendOrder(order) {
  try {
    console.log('📊 Attempting to add order to Google Sheets:', order.id);
    
    // Ensure headers exist first
    await ensureOrderHeaders();
    
    const sheets = await getSheetsClient();
    
    // Format createdAt date
    const createdAt = order.created_at ? 
      new Date(order.created_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const values = [
      order.id || '',
      order.customer_name || order.customerName || '',
      order.date || '',
      order.price || 0,
      order.status || '',
      order.items || '',
      order.address || '',
      order.payment_method || order.payment_type || '',
      order.notes || '',
      createdAt
    ];
    
    console.log('📝 Order data to append:', values);
    
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
    
    console.log('✅ Successfully added order to Google Sheets');
    return result;
  } catch (error) {
    console.error('❌ Error in appendOrder:', error.message);
    throw error;
  }
}

async function findOrderRowIndex(order_id) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Orders!A:A',
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === order_id.toString()) return i + 1;
  }
  return -1;
}

async function updateOrder(order, rowIndex) {
  try {
    console.log('📊 Updating order in Google Sheets:', order.id);
    const sheets = await getSheetsClient();
    
    // Format updatedAt date
    const updatedAt = order.updated_at ? 
      new Date(order.updated_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const values = [
      order.id || '',
      order.customer_name || order.customerName || '',
      order.date || '',
      order.price || 0,
      order.status || '',
      order.items || '',
      order.address || '',
      order.payment_method || order.payment_type || '',
      order.notes || '',
      updatedAt
    ];
    
    console.log('📝 Order data to update:', values);
    
    const range = `Orders!A${rowIndex}:J${rowIndex}`;
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    
    console.log('✅ Successfully updated order in Google Sheets');
    return result;
  } catch (error) {
    console.error('❌ Error in updateOrder:', error.message);
    throw error;
  }
}

// Inventory functions
async function appendInventoryItem(product) {
  try {
    console.log('📊 Attempting to add inventory item to Google Sheets:', product.name);
    
    // Ensure headers exist first
    await ensureInventoryHeaders();
    
    const sheets = await getSheetsClient();
    
    // Format lastUpdated date
    const lastUpdated = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const values = [
      product.name || '',
      product.total_quantity || product.quantity || 0,
      product.status || '',
      product.category || '',
      product.brand || '',
      product.price || product.selling_price || 0,
      lastUpdated,
      product.total_quantity > 0 ? 'In Stock' : 'Out of Stock'
    ];
    
    console.log('📝 Inventory data to append:', values);
    
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
    
    console.log('✅ Successfully added inventory item to Google Sheets');
    return result;
  } catch (error) {
    console.error('❌ Error in appendInventoryItem:', error.message);
    throw error;
  }
}

async function findInventoryRowIndex(product_name) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Inventory!A:A',
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === product_name) return i + 1;
  }
  return -1;
}

async function updateInventoryItem(product, rowIndex) {
  try {
    console.log('📊 Updating inventory item in Google Sheets:', product.name);
    const sheets = await getSheetsClient();
    
    // Format lastUpdated date
    const lastUpdated = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const values = [
      product.name || '',
      product.total_quantity || product.quantity || 0,
      product.status || '',
      product.category || '',
      product.brand || '',
      product.price || product.selling_price || 0,
      lastUpdated,
      product.total_quantity > 0 ? 'In Stock' : 'Out of Stock'
    ];
    
    console.log('📝 Inventory data to update:', values);
    
    const range = `Inventory!A${rowIndex}:H${rowIndex}`;
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    
    console.log('✅ Successfully updated inventory item in Google Sheets');
    return result;
  } catch (error) {
    console.error('❌ Error in updateInventoryItem:', error.message);
    throw error;
  }
}

module.exports = {
  getSheetsClient,
  ensureCustomerHeaders,
  appendCustomer,
  findCustomerRowIndex,
  updateCustomer,
  deleteCustomerRow,
  // Orders
  ensureOrderHeaders,
  appendOrder,
  findOrderRowIndex,
  updateOrder,
  // Inventory
  ensureInventoryHeaders,
  appendInventoryItem,
  findInventoryRowIndex,
  updateInventoryItem,
};
