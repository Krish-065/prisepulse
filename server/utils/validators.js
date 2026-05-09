// Validation utilities
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return re.test(password);
};

const validateSymbol = (symbol) => {
  // Only letters and numbers, 1-10 characters
  return /^[A-Z0-9]{1,10}$/.test(symbol.toUpperCase());
};

const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity > 0;
};

const validatePrice = (price) => {
  return !isNaN(price) && price > 0;
};

const validatePhoneNumber = (phone) => {
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
};

module.exports = {
  validateEmail,
  validatePassword,
  validateSymbol,
  validateQuantity,
  validatePrice,
  validatePhoneNumber
};
