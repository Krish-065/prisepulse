import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export default function Dashboard() {
  const [indices, setIndices] = useState({ nifty: '--', sensex: '--', banknifty: '--' });

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await apiClient.get('/market/indices');
        setIndices({
          nifty: res.data['^NSEI']?.price?.toFixed(2) || '--',
          sensex: res.data['^BSESN']?.price?.toFixed(2) || '--',
          banknifty: res.data['^NSEBANK']?.price?.toFixed(2) || '--',
        });
      } catch (err) {
        console.error('Error fetching indices:', err);
      }
    };
    fetchIndices();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <p>NIFTY 50: {indices.nifty}</p>
        <p>SENSEX: {indices.sensex}</p>
        <p>BANK NIFTY: {indices.banknifty}</p>
      </div>
    </div>
  );
}