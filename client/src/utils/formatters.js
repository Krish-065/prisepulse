// Utility functions for formatting
export const formatCurrency = (value, decimals = 2) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercentage = (value, decimals = 2) => {
  const formatted = value.toFixed(decimals);
  return `${value > 0 ? '+' : ''}${formatted}%`;
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
};

export const formatLargeNumber = (value) => {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toFixed(2);
};

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'time') {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  if (format === 'full') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  }
  return d.toISOString();
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

export const calculateReturn = (invested, current) => {
  return ((current - invested) / invested) * 100;
};

export const calculateCAGR = (startValue, endValue, years) => {
  if (years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

export default {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatLargeNumber,
  formatDate,
  formatTime,
  calculateReturn,
  calculateCAGR
};
