const sql = require('../config/supabase');

async function testMigration() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const testResult = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if payment table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payment'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ Payment table exists');
      
      // Check table structure
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'payment'
        ORDER BY ordinal_position;
      `;
      
      console.log('📋 Payment table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Try to add PhonePe columns if they don't exist
      try {
        await sql`ALTER TABLE payment ADD COLUMN IF NOT EXISTS merchant_transaction_id VARCHAR(255)`;
        await sql`ALTER TABLE payment ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)`;
        await sql`ALTER TABLE payment ADD COLUMN IF NOT EXISTS response_code VARCHAR(50)`;
        console.log('✅ PhonePe columns added/verified');
      } catch (error) {
        console.log('⚠️  Error adding PhonePe columns:', error.message);
      }
      
    } else {
      console.log('❌ Payment table does not exist');
      console.log('Creating payment table...');
      
      await sql`
        CREATE TABLE payment (
          id SERIAL PRIMARY KEY,
          order_id INTEGER,
          amount DECIMAL(10,2),
          status VARCHAR(50),
          method VARCHAR(50),
          merchant_transaction_id VARCHAR(255),
          transaction_id VARCHAR(255),
          response_code VARCHAR(50),
          payment_date TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      console.log('✅ Payment table created');
    }
    
  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testMigration();