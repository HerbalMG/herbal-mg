// googleSheets.js
const { google } = require('googleapis');
const path = require('path');

async function getSheetsClient() {
  try {
    const keyFilePath = path.join(__dirname, '../json/herbalmg-9a3e8-c15a18ff5a68.json');
    console.log('🔑 Using Google Sheets JSON file:', keyFilePath);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    console.log('✅ Google Sheets client initialized successfully');
    return sheets;
  } catch (error) {
    console.error('❌ Google Sheets authentication failed:', error.message);
    throw new Error(`Google Sheets not configured properly: ${error.message}`);
  }
}

module.exports = getSheetsClient;
