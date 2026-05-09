// Helper functions
const formatCurrency = (value, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(value);
};

const formatPercentage = (value) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const calculateReturns = (invested, current) => {
  return ((current - invested) / invested) * 100;
};

const calculateCAGR = (startValue, endValue, years) => {
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

const getDaysSince = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getHoursSince = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60));
};

const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return date;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  formatCurrency,
  formatPercentage,
  calculateReturns,
  calculateCAGR,
  getDaysSince,
  getHoursSince,
  formatDate,
  sleep,
  generateId
};
