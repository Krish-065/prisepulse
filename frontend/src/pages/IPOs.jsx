import { useState, useEffect } from 'react';
import styled from 'styled-components';

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

  tr.status-upcoming {
    background: rgba(255, 193, 7, 0.03);
  }
  tr.status-upcoming:hover {
    background: rgba(255, 193, 7, 0.08);
  }

  tr.status-open {
    background: rgba(0, 255, 136, 0.05);
  }
  tr.status-open:hover {
    background: rgba(0, 255, 136, 0.1);
  }

  tr.status-closed {
    background: rgba(255, 255, 255, 0.01);
  }
  tr.status-closed:hover {
    background: rgba(255, 255, 255, 0.04);
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

  .btn {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-apply {
    background: #00ff88;
    color: #0a0e27;
  }
  .btn-apply:hover {
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  }

  .btn-preapply {
    background: #ffc107;
    color: #0a0e27;
  }

  .btn-allotment {
    background: transparent;
    border: 1px solid #00bcd4;
    color: #00bcd4;
  }
  .btn-allotment:hover {
    background: rgba(0, 188, 212, 0.1);
  }
`;

export default function IPOs() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Massive mock dataset for realism
    const mockData = [
      {
        id: 1,
        company: 'Awfis Space Solutions',
        type: 'MAINBOARD',
        gmp: '115',
        gmpPercent: '30.0%',
        open: 'May 22, 2026',
        close: 'May 27, 2026',
        price: '364-383',
        lotSize: 39,
        issueSize: '598.93',
        lm: ['ICICI Securities', 'Axis Capital'],
        allotment: 'May 28, 2026',
        listing: 'May 30, 2026',
        status: 'open'
      },
      {
        id: 2,
        company: 'Vilas Transcore',
        type: 'NSE SME',
        gmp: '130',
        gmpPercent: '88.4%',
        open: 'May 27, 2026',
        close: 'May 29, 2026',
        price: '139-147',
        lotSize: 1000,
        issueSize: '95.26',
        lm: ['Hem Securities'],
        allotment: 'May 30, 2026',
        listing: 'Jun 3, 2026',
        status: 'upcoming'
      },
      {
        id: 101,
        company: 'Swiggy',
        type: 'MAINBOARD',
        gmp: '185',
        gmpPercent: '42.5%',
        open: 'Jun 12, 2026',
        close: 'Jun 15, 2026',
        price: '400-435',
        lotSize: 35,
        issueSize: '10414.00',
        lm: ['Kotak Mahindra', 'Citi'],
        allotment: 'Jun 16, 2026',
        listing: 'Jun 19, 2026',
        status: 'upcoming'
      },
      {
        id: 102,
        company: 'Hyundai Motor India',
        type: 'MAINBOARD',
        gmp: '250',
        gmpPercent: '15.2%',
        open: 'Jun 18, 2026',
        close: 'Jun 20, 2026',
        price: '1550-1640',
        lotSize: 10,
        issueSize: '25000.00',
        lm: ['Morgan Stanley', 'JP Morgan'],
        allotment: 'Jun 21, 2026',
        listing: 'Jun 24, 2026',
        status: 'upcoming'
      },
      {
        id: 3,
        company: 'Beacon Trusteeship',
        type: 'NSE SME',
        gmp: '40',
        gmpPercent: '66.6%',
        open: 'May 28, 2026',
        close: 'May 30, 2026',
        price: '60',
        lotSize: 2000,
        issueSize: '32.52',
        lm: ['Beeline Capital'],
        allotment: 'May 31, 2026',
        listing: 'Jun 4, 2026',
        status: 'open'
      },
      {
        id: 103,
        company: 'Kronox Lab Sciences',
        type: 'MAINBOARD',
        gmp: '82',
        gmpPercent: '60.2%',
        open: 'Jun 3, 2026',
        close: 'Jun 5, 2026',
        price: '129-136',
        lotSize: 110,
        issueSize: '130.15',
        lm: ['Pantomath Capital'],
        allotment: 'Jun 6, 2026',
        listing: 'Jun 10, 2026',
        status: 'upcoming'
      },
      {
        id: 104,
        company: 'Ola Electric',
        type: 'MAINBOARD',
        gmp: '35',
        gmpPercent: '24.1%',
        open: 'Jun 25, 2026',
        close: 'Jun 27, 2026',
        price: '135-145',
        lotSize: 100,
        issueSize: '5500.00',
        lm: ['Kotak Mahindra', 'BofA'],
        allotment: 'Jun 28, 2026',
        listing: 'Jul 2, 2026',
        status: 'upcoming'
      },
      {
        id: 4,
        company: 'Go Digit General Insurance',
        type: 'MAINBOARD',
        gmp: '12',
        gmpPercent: '4.4%',
        open: 'May 15, 2026',
        close: 'May 17, 2026',
        price: '258-272',
        lotSize: 55,
        issueSize: '2614.65',
        lm: ['ICICI Securities', 'Morgan Stanley'],
        allotment: 'May 21, 2026',
        listing: 'May 23, 2026',
        status: 'closed'
      },
      {
        id: 105,
        company: 'FirstCry (Brainbees)',
        type: 'MAINBOARD',
        gmp: '105',
        gmpPercent: '18.5%',
        open: 'Jul 10, 2026',
        close: 'Jul 12, 2026',
        price: '540-565',
        lotSize: 26,
        issueSize: '4193.00',
        lm: ['Kotak Mahindra', 'Morgan Stanley'],
        allotment: 'Jul 13, 2026',
        listing: 'Jul 16, 2026',
        status: 'upcoming'
      },
      {
        id: 106,
        company: 'TBI Corn',
        type: 'NSE SME',
        gmp: '45',
        gmpPercent: '47.8%',
        open: 'May 31, 2026',
        close: 'Jun 4, 2026',
        price: '90-94',
        lotSize: 1200,
        issueSize: '44.94',
        lm: ['Swastika Investmart'],
        allotment: 'Jun 5, 2026',
        listing: 'Jun 9, 2026',
        status: 'upcoming'
      },
      {
        id: 107,
        company: 'Aadhar Housing Finance',
        type: 'MAINBOARD',
        gmp: '65',
        gmpPercent: '20.6%',
        open: 'May 8, 2026',
        close: 'May 10, 2026',
        price: '300-315',
        lotSize: 47,
        issueSize: '3000.00',
        lm: ['ICICI Securities', 'Nomura'],
        allotment: 'May 13, 2026',
        listing: 'May 15, 2026',
        status: 'closed'
      },
      {
        id: 108,
        company: 'TBO Tek',
        type: 'MAINBOARD',
        gmp: '340',
        gmpPercent: '36.9%',
        open: 'May 8, 2026',
        close: 'May 10, 2026',
        price: '875-920',
        lotSize: 16,
        issueSize: '1550.81',
        lm: ['Axis Capital', 'Jefferies'],
        allotment: 'May 13, 2026',
        listing: 'May 15, 2026',
        status: 'closed'
      },
      {
        id: 5,
        company: 'Ztech India',
        type: 'NSE SME',
        gmp: '-5',
        gmpPercent: '-4.5%',
        open: 'May 29, 2026',
        close: 'May 31, 2026',
        price: '104-110',
        lotSize: 1200,
        issueSize: '37.30',
        lm: ['Narnolia Financial'],
        allotment: 'Jun 3, 2026',
        listing: 'Jun 5, 2026',
        status: 'open'
      },
      {
        id: 109,
        company: 'Indegene',
        type: 'MAINBOARD',
        gmp: '255',
        gmpPercent: '56.4%',
        open: 'May 6, 2026',
        close: 'May 8, 2026',
        price: '430-452',
        lotSize: 33,
        issueSize: '1841.76',
        lm: ['Kotak Mahindra', 'Citigroup'],
        allotment: 'May 9, 2026',
        listing: 'May 13, 2026',
        status: 'closed'
      },
      {
        id: 110,
        company: 'OYO (Oravel Stays)',
        type: 'MAINBOARD',
        gmp: '42',
        gmpPercent: '11.5%',
        open: 'Aug 18, 2026',
        close: 'Aug 21, 2026',
        price: '350-365',
        lotSize: 40,
        issueSize: '8430.00',
        lm: ['Kotak Mahindra', 'JP Morgan'],
        allotment: 'Aug 24, 2026',
        listing: 'Aug 27, 2026',
        status: 'upcoming'
      }
    ];

    setTimeout(() => {
      setIpos(mockData);
      setLoading(false);
    }, 600);
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
      </div>

      <PremiumTable>
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>GMP Rumors *</th>
              <th>Open Date</th>
              <th>Close Date</th>
              <th>Price (₹)</th>
              <th>Lot Size</th>
              <th>Issue Size (Cr)</th>
              <th>Lead Managers</th>
              <th>Allotment</th>
              <th>Listing</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ipos.map((ipo) => (
              <tr key={ipo.id} className={`status-${ipo.status}`}>
                <td>
                  <span className="company-name">{ipo.company}</span>
                  <span className="sme-badge">{ipo.type}</span>
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
                <td>
                  {ipo.status === 'open' && <button className="btn btn-apply">Apply Now</button>}
                  {ipo.status === 'upcoming' && <button className="btn btn-preapply">Pre-Apply</button>}
                  {ipo.status === 'closed' && <button className="btn btn-allotment">Check Allotment</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PremiumTable>
    </div>
  );
}