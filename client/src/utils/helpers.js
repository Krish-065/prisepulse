// Client-side helper utilities
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

export const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (key in cache) return cache[key];
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
};

export const groupBy = (arr, key) => {
  return arr.reduce((acc, obj) => {
    const group = obj[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(obj);
    return acc;
  }, {});
};

export const sortBy = (arr, key, order = 'asc') => {
  return [...arr].sort((a, b) => {
    if (order === 'asc') return a[key] > b[key] ? 1 : -1;
    return a[key] < b[key] ? 1 : -1;
  });
};

export const uniqueBy = (arr, key) => {
  const seen = new Set();
  return arr.filter(obj => {
    const value = obj[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const cloneDeep = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export default {
  sleep,
  debounce,
  throttle,
  memoize,
  groupBy,
  sortBy,
  uniqueBy,
  generateId,
  cloneDeep
};
