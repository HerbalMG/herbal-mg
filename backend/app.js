const express = require('express');
const cors = require('cors');
const { errorConverter, errorHandler } = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const blogRoutes = require('./routes/blogRoutes');
const referenceBookRoutes = require('./routes/referenceBookRoutes');
const brandRoutes = require('./routes/brandRoutes');
const customerRoutes = require('./routes/customerRoutes');
const addressRoutes = require('./routes/addressRoutes');
const customerAddressRoutes = require('./routes/customerAddressRoutes');
const googleSheetsRoutes = require('./routes/googleSheetsRoutes');

const deliveryStatusRoutes = require('./routes/deliveryStatus');
const diseaseRoutes = require('./routes/diseaseRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const imageRouter = require('./routes/image');

const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');
const otpAuthRoutes = require('./routes/otpAuthRoutes');
const mainCategoryRouter = require('./routes/mainCategoryRoutes');
const orderItemRoutes = require('./routes/orderItemRoutes');
const orderRoutes = require('./routes/orderRoutes');

const paymentRoutes = require('./routes/paymentRoutes');
const productPriceRoutes = require('./routes/productPriceRoutes');

const productRoutes = require('./routes/productRoutes');
const searchRoutes = require('./routes/searchRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const uploadRoutes = require('./routes/upload');
const migrationRoutes = require('./routes/migration');
const productDiseaseRoutes = require('./routes/productDiseaseRoutes');



// API Routes - All routes are prefixed with /api
app.use('/api/users', userRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/reference-books', referenceBookRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/customer', customerAddressRoutes);
app.use('/api', googleSheetsRoutes);
app.use('/api/delivery_status', deliveryStatusRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/images', imageRouter);
app.use('/api', locationRoutes);
app.use('/api', authRoutes); // This will make /api/login and /api/logout available
app.use('/api/auth', otpAuthRoutes); // OTP authentication for customers
app.use('/api/main-category', mainCategoryRouter);
app.use('/api/category', mainCategoryRouter); // Also mount as /category for compatibility
app.use('/api/main_category', mainCategoryRouter); // Legacy underscore route support
app.use('/api/order-items', orderItemRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/product', productRoutes);
app.use('/api/product_price', productPriceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sub-categories', subCategoryRoutes);
app.use('/api', uploadRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/product-disease', productDiseaseRoutes);

// Test route to verify Postgres connection
const sql = require('./config/supabase').default || require('./config/supabase');
app.get('/api/postgres-test', async (req, res) => {
  try {
    const result = await sql`SELECT 1 as test`;
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route for payment integration
app.get('/api/payment-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payment API is working',
    phonepe_config: {
      merchant_id: process.env.PHONEPE_MERCHANT_ID || 'Not configured',
      base_url: process.env.PHONEPE_BASE_URL || 'Not configured'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler - must be before error handlers
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// Error handling middleware - must be last
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
