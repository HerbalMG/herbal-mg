const axios = require('axios');
const crypto = require('crypto');
const { PHONEPE_CONFIG, generateXVerify, generateMerchantTransactionId } = require('../config/phonepe');

class PhonePeService {
  
  // Initiate payment
  async initiatePayment(orderData) {
    try {
      const merchantTransactionId = generateMerchantTransactionId();
      
      const payload = {
        merchantId: PHONEPE_CONFIG.MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: `USER_${orderData.userId}`,
        amount: Math.round(orderData.amount * 100), // Convert to paise
        redirectUrl: `${PHONEPE_CONFIG.REDIRECT_URL}?transactionId=${merchantTransactionId}`,
        redirectMode: 'POST',
        callbackUrl: PHONEPE_CONFIG.CALLBACK_URL,
        mobileNumber: orderData.mobileNumber,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const endpoint = '/pg/v1/pay';
      const xVerify = generateXVerify(base64Payload, endpoint);

      const response = await axios.post(
        `${PHONEPE_CONFIG.BASE_URL}${endpoint}`,
        {
          request: base64Payload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify
          }
        }
      );

      return {
        success: true,
        merchantTransactionId,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
        data: response.data
      };

    } catch (error) {
      console.error('PhonePe payment initiation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Check payment status
  async checkPaymentStatus(merchantTransactionId) {
    try {
      const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`;
      const xVerify = generateXVerify('', endpoint);

      const response = await axios.get(
        `${PHONEPE_CONFIG.BASE_URL}${endpoint}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID
          }
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('PhonePe status check error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Verify callback signature
  verifyCallback(receivedSignature, payload) {
    try {
      const expectedSignature = crypto
        .createHash('sha256')
        .update(payload + PHONEPE_CONFIG.SALT_KEY)
        .digest('hex') + '###' + PHONEPE_CONFIG.SALT_INDEX;
      
      return receivedSignature === expectedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
}

module.exports = new PhonePeService();