/**
 * Product validation schemas
 */

const createProduct = {
  body: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 255,
    },
    brand_id: {
      required: false,
      type: 'number',
      min: 1,
    },
    category: {
      required: false,
      type: 'string',
      maxLength: 100,
    },
    main_category_id: {
      required: false,
      type: 'number',
      min: 1,
    },
    sub_category_id: {
      required: false,
      type: 'number',
      min: 1,
    },
    actual_price: {
      required: true,
      type: 'number',
      min: 0,
    },
    selling_price: {
      required: true,
      type: 'number',
      min: 0,
      custom: (value, data) => {
        if (value > data.actual_price) {
          return 'must not exceed actual price';
        }
      },
    },
    stock_quantity: {
      required: false,
      type: 'number',
      min: 0,
    },
    description: {
      required: false,
      type: 'string',
      maxLength: 5000,
    },
  },
};

const updateProduct = {
  params: {
    id: {
      required: true,
      type: 'string',
      pattern: /^\d+$/,
    },
  },
  body: {
    name: {
      required: false,
      type: 'string',
      minLength: 2,
      maxLength: 255,
    },
    actual_price: {
      required: false,
      type: 'number',
      min: 0,
    },
    selling_price: {
      required: false,
      type: 'number',
      min: 0,
    },
    stock_quantity: {
      required: false,
      type: 'number',
      min: 0,
    },
  },
};

const getProduct = {
  params: {
    id: {
      required: true,
      type: 'string',
      pattern: /^\d+$/,
    },
  },
};

const getProducts = {
  query: {
    page: {
      required: false,
      type: 'string',
      pattern: /^\d+$/,
    },
    limit: {
      required: false,
      type: 'string',
      pattern: /^\d+$/,
    },
    search: {
      required: false,
      type: 'string',
      maxLength: 100,
    },
    brandId: {
      required: false,
      type: 'string',
      pattern: /^\d+$/,
    },
    category: {
      required: false,
      type: 'string',
      maxLength: 100,
    },
  },
};

module.exports = {
  createProduct,
  updateProduct,
  getProduct,
  getProducts,
};
