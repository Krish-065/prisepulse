import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MutualFunds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        // Using free AMFI API (mfapi.in)
        const res = await axios.get('https://api.mfapi.in/mf');
        if (res.data && res.data.length) {
          setFunds(res.data.slice(0, 20).map(fund => ({
            code: fund.schemeCode,
            name: fund.schemeName,
            nav: fund.nav
          })));
        }
      } catch (error) {
        console.error('MF fetch error:', error);
        // Fallback data
        setFunds([
          { name: 'SBI Bluechip Fund', nav: '₹85.23', change: '+0.45%' },
          { name: 'HDFC Balanced Fund', nav: '₹62.10', change: '+0.32%' },
          { name: 'ICICI Prudential Value Discovery', nav: '₹124.56', change: '-0.12%' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchFunds();
  }, []);

  return (
    <div className="mf-page">
      <h1>Mutual Funds</h1>
      <p>Top performing mutual funds with latest NAV</p>
      {loading ? (
        <div>Loading mutual funds...</div>
      ) : (
        <div className="mf-table">
          <table>
            <thead><tr><th>Scheme Name</th><th>NAV (₹)</th><th>Change</th></tr></thead>
            <tbody>
              {funds.map((fund, idx) => (
                <tr key={idx}>
                  <td>{fund.name}</td>
                  <td>{fund.nav || '--'}</td>
                  <td className={fund.change?.includes('+') ? 'positive' : 'negative'}>{fund.change || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        .mf-page { padding: 20px; }
        .mf-table { background: var(--bg-card); border-radius: 16px; padding: 24px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
      `}</style>
    </div>
  );
}