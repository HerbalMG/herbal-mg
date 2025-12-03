const express = require('express');
const router = express.Router();
const otpAuthController = require('../controllers/otpAuthController');
const { customerAuth } = require('../middleware/customerAuth');
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');

// Public routes
router.post('/send-otp', validate(authValidation.sendOtp), otpAuthController.sendOtp);
router.post('/verify-otp', validate(authValidation.verifyOtp), otpAuthController.verifyOtp);

// Protected routes (require customer authentication)
router.get('/profile', customerAuth, otpAuthController.getProfile);
router.put('/profile', customerAuth, otpAuthController.updateProfile);
router.post('/logout', customerAuth, otpAuthController.logout);

module.exports = router;
