import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiClient } from '../services/api';

const PremiumTable = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  background: #0a0e27;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    white-space: nowrap;
  }

  th {
    background: rgba(255, 255, 255, 0.03);
    padding: 16px 12px;
    text-align: left;
    color: #9b9eac;
    font-weight: 600;
    border-bottom: 2px solid rgba(0, 255, 136, 0.2);
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }

  td {
    padding: 14px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    color: #e1e3e6;
  }

  tr:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .gmp-positive {
    color: #00ff88;
    font-weight: 700;
  }
  .gmp-negative {
    color: #ff3366;
    font-weight: 700;
  }
  .gmp-neutral {
    color: #9b9eac;
  }

  .company-name {
    font-weight: 700;
    font-size: 14px;
    color: #ffffff;
  }
  
  .sme-badge {
    font-size: 10px;
    background: rgba(0, 188, 212, 0.15);
    color: #00bcd4;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 6px;
  }

  .lm-list {
    margin: 0;
    padding-left: 14px;
    font-size: 12px;
    color: #9b9eac;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 12px;
    text-transform: uppercase;
  }
  .status-badge-open {
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88;
    border: 1px solid rgba(0, 255, 136, 0.2);
  }
  .status-badge-upcoming {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
    border: 1px solid rgba(255, 193, 7, 0.2);
  }
  .status-badge-closed {
    background: rgba(255, 255, 255, 0.05);
    color: #9b9eac;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

export default function IPOs() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchIpos = async () => {
    try {
      const res = await apiClient.get('/market/ipos');
      setIpos(res.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching IPO data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpos();
    const interval = setInterval(fetchIpos, 10000); // Poll every 10s for live updates
    return () => clearInterval(interval);
  }, []);

  const getGMPClass = (gmp) => {
    const val = parseFloat(gmp);
    if (val > 0) return 'gmp-positive';
    if (val < 0) return 'gmp-negative';
    return 'gmp-neutral';
  };

  if (loading) {
    return <div className="loading" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff88', fontSize: '20px' }}>Loading Live IPO Data...</div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, backgroundImage: 'linear-gradient(135deg, #00ff88, #00bcd4)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>Live IPO Center</h1>
          <p style={{ color: '#9b9eac', margin: '4px 0 0 0', fontSize: '14px' }}>Real-time GMP, Subscription & Allotment tracking</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="live-badge">LIVE</span>
          {lastUpdated && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Updated: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      <PremiumTable>
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Issue Type</th>
              <th>Status</th>
              <th>GMP Rumors *</th>
              <th>Open Date</th>
              <th>Close Date</th>
              <th>Price (₹)</th>
              <th>Lot Size</th>
              <th>Issue Size (Cr)</th>
              <th>Lead Managers</th>
              <th>Allotment</th>
              <th>Listing</th>
            </tr>
          </thead>
          <tbody>
            {ipos.map((ipo) => (
              <tr key={ipo.id}>
                <td>
                  <span className="company-name">{ipo.company}</span>
                </td>
                <td>
                  <span className="sme-badge" style={{ marginLeft: 0 }}>{ipo.type}</span>
                </td>
                <td>
                  {ipo.status === 'open' && <span className="status-badge status-badge-open">● Open</span>}
                  {ipo.status === 'upcoming' && <span className="status-badge status-badge-upcoming">● Upcoming</span>}
                  {ipo.status === 'closed' && <span className="status-badge status-badge-closed">● Closed</span>}
                </td>
                <td>
                  <div className={getGMPClass(ipo.gmp)}>
                    ₹{ipo.gmp} <br/>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>({ipo.gmpPercent})</span>
                  </div>
                </td>
                <td>{ipo.open}</td>
                <td>{ipo.close}</td>
                <td style={{ fontWeight: 600 }}>{ipo.price}</td>
                <td>{ipo.lotSize}</td>
                <td>{ipo.issueSize}</td>
                <td>
                  <ul className="lm-list">
                    {ipo.lm.map((mgr, i) => <li key={i}>{mgr}</li>)}
                  </ul>
                </td>
                <td>{ipo.allotment}</td>
                <td>{ipo.listing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PremiumTable>
    </div>
  );
}