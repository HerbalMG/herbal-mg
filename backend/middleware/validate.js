const ApiError = require('../utils/ApiError');

/**
 * Validation middleware factory
 * @param {Object} schema - Validation schema with rules
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schema.body) {
      const bodyErrors = validateObject(req.body, schema.body, 'body');
      errors.push(...bodyErrors);
    }

    // Validate query
    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query, 'query');
      errors.push(...queryErrors);
    }

    // Validate params
    if (schema.params) {
      const paramErrors = validateObject(req.params, schema.params, 'params');
      errors.push(...paramErrors);
    }

    if (errors.length > 0) {
      throw ApiError.badRequest(`Validation failed: ${errors.join(', ')}`);
    }

    next();
  };
};

/**
 * Validate an object against rules
 */
function validateObject(data, rules, location) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${location}.${field} is required`);
      continue;
    }

    // Skip further validation if field is optional and not provided
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`${location}.${field} must be of type ${rule.type}`);
      }
    }

    // Min length check
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${location}.${field} must be at least ${rule.minLength} characters`);
    }

    // Max length check
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${location}.${field} must not exceed ${rule.maxLength} characters`);
    }

    // Min value check
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${location}.${field} must be at least ${rule.min}`);
    }

    // Max value check
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${location}.${field} must not exceed ${rule.max}`);
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${location}.${field} has invalid format`);
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${location}.${field} must be one of: ${rule.enum.join(', ')}`);
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value, data);
      if (customError) {
        errors.push(`${location}.${field} ${customError}`);
      }
    }
  }

  return errors;
}

module.exports = validate;
