/**
 * Authentication validation schemas
 */

const sendOtp = {
  body: {
    mobile: {
      required: true,
      type: 'string',
      pattern: /^[6-9]\d{9}$/,
      custom: (value) => {
        if (!/^[6-9]\d{9}$/.test(value)) {
          return 'must be a valid 10-digit Indian mobile number';
        }
      },
    },
  },
};

const verifyOtp = {
  body: {
    mobile: {
      required: true,
      type: 'string',
      pattern: /^[6-9]\d{9}$/,
    },
    otp: {
      required: true,
      type: 'string',
      pattern: /^\d{6}$/,
      custom: (value) => {
        if (!/^\d{6}$/.test(value)) {
          return 'must be a 6-digit number';
        }
      },
    },
  },
};

const login = {
  body: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
    },
    password: {
      required: true,
      type: 'string',
      minLength: 6,
    },
  },
};

const register = {
  body: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
    },
    mobile: {
      required: true,
      type: 'string',
      pattern: /^[6-9]\d{9}$/,
    },
    email: {
      required: false,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'must be a valid email address';
        }
      },
    },
  },
};

module.exports = {
  sendOtp,
  verifyOtp,
  login,
  register,
};
