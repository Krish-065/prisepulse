// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
};

export const validateSymbol = (symbol) => {
  return /^[A-Z0-9&]{1,10}$/.test(symbol.toUpperCase());
};

export const validateQuantity = (quantity) => {
  return Number.isInteger(parseFloat(quantity)) && quantity > 0;
};

export const validatePrice = (price) => {
  return !isNaN(parseFloat(price)) && parseFloat(price) > 0;
};

export const validatePhoneNumber = (phone) => {
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
};

export const validatePAN = (pan) => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
};

export const validateAadhar = (aadhar) => {
  return /^[0-9]{12}$/.test(aadhar.replace(/\s/g, ''));
};

export const getValidationError = (field, value) => {
  switch (field) {
    case 'email':
      return validateEmail(value) ? '' : 'Invalid email address';
    case 'password':
      return validatePassword(value) ? '' : 'Password must be 6+ chars with uppercase, lowercase, and number';
    case 'phone':
      return validatePhoneNumber(value) ? '' : 'Phone number must be 10 digits';
    case 'quantity':
      return validateQuantity(value) ? '' : 'Quantity must be a positive number';
    case 'price':
      return validatePrice(value) ? '' : 'Price must be a positive number';
    default:
      return '';
  }
};

export default {
  validateEmail,
  validatePassword,
  validateSymbol,
  validateQuantity,
  validatePrice,
  validatePhoneNumber,
  validatePAN,
  validateAadhar,
  getValidationError
};
