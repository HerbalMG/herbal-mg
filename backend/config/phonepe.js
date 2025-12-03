const crypto = require('crypto');
require('dotenv').config();

const PHONEPE_CONFIG = {
  MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT',
  SALT_KEY: process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399',
  SALT_INDEX: process.env.PHONEPE_SALT_INDEX || '1',
  BASE_URL: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  REDIRECT_URL: process.env.PHONEPE_REDIRECT_URL || 'http://localhost:3000/payment/callback',
  CALLBACK_URL: process.env.PHONEPE_CALLBACK_URL || 'http://localhost:3001/api/payments/phonepe/callback'
};

// Generate X-VERIFY header
const generateXVerify = (payload, endpoint) => {
  const string = payload + endpoint + PHONEPE_CONFIG.SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  return sha256 + '###' + PHONEPE_CONFIG.SALT_INDEX;
};

// Generate merchant transaction ID
const generateMerchantTransactionId = () => {
  return 'MT' + Date.now() + Math.floor(Math.random() * 1000);
};

module.exports = {
  PHONEPE_CONFIG,
  generateXVerify,
  generateMerchantTransactionId
};