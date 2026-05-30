/**
 * Form Validators
 * Validation functions for form inputs
 */

// Email validation
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Phone validation (Tunisian format)
export const validatePhone = (phone) => {
  const regex = /^(\+216|00216)?[2-9]\d{7}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

// CIN validation (Tunisian ID)
export const validateCIN = (cin) => {
  return cin && cin.length === 8 && /^\d{8}$/.test(cin);
};

// Password validation
export const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Username validation
export const validateUsername = (username) => {
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(username);
};

// Required field
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Min length
export const validateMinLength = (value, length) => {
  return value && value.toString().length >= length;
};

// Max length
export const validateMaxLength = (value, length) => {
  return !value || value.toString().length <= length;
};

// Number validation
export const validateNumber = (value) => {
  return !isNaN(value) && value !== '';
};

// Date validation
export const validateDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

// Composite validation for forms
export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = data[field];
    
    if (rules.required && !validateRequired(value)) {
      errors[field] = `${field} est requis`;
    }
    
    if (rules.email && value && !validateEmail(value)) {
      errors[field] = `${field} doit être un email valide`;
    }
    
    if (rules.minLength && !validateMinLength(value, rules.minLength)) {
      errors[field] = `${field} doit avoir au moins ${rules.minLength} caractères`;
    }
    
    if (rules.maxLength && !validateMaxLength(value, rules.maxLength)) {
      errors[field] = `${field} ne doit pas dépasser ${rules.maxLength} caractères`;
    }
  });
  
  return errors;
};

export default {
  validateEmail,
  validatePhone,
  validateCIN,
  validatePassword,
  validateUsername,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateDate,
  validateForm,
};
