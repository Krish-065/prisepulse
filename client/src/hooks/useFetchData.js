import { useState, useCallback, useRef, useEffect } from 'react';

export const useFetchData = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cacheRef.current[url] && !options.skipCache) {
      setData(cacheRef.current[url]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      cacheRef.current[url] = result;
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    delete cacheRef.current[url];
    fetchData();
  }, [fetchData, url]);

  return { data, loading, error, refetch };
};

export default useFetchData;
