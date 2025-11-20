const db = require('./config/database');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const [result] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!', result);
    
    // Test if notifications table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'notifications'");
    if (tables.length > 0) {
      console.log('✅ Notifications table exists');
    } else {
      console.log('❌ Notifications table does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();