/**
 * Test script for OTP Authentication
 * Run with: node test-otp-auth.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';
const TEST_MOBILE = '9876543210';

async function testOTPAuth() {
  console.log('🧪 Testing OTP Authentication...\n');

  try {
    // Step 1: Send OTP
    console.log('📱 Step 1: Sending OTP to', TEST_MOBILE);
    const sendResponse = await axios.post(`${BASE_URL}/send-otp`, {
      mobile: TEST_MOBILE
    });

    console.log('✅ OTP sent successfully');
    console.log('Response:', sendResponse.data);
    
    const otp = sendResponse.data.otp;
    if (!otp) {
      console.log('⚠️  OTP not returned (production mode). Check console logs on server.');
      return;
    }

    console.log('\n🔐 OTP:', otp);

    // Step 2: Verify OTP
    console.log('\n📝 Step 2: Verifying OTP');
    const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      mobile: TEST_MOBILE,
      otp: otp
    });

    console.log('✅ OTP verified successfully');
    console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));

    console.log('\n✨ Test completed successfully!');
    console.log('\nUser Details:');
    console.log('- User ID:', verifyResponse.data.userId);
    console.log('- Is New User:', verifyResponse.data.isNewUser);
    console.log('- Token:', verifyResponse.data.token?.substring(0, 20) + '...');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testOTPAuth();
