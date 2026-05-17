import { useState, useEffect } from 'react';
import axios from 'axios';

export default function IPOs() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIPOs = async () => {
      try {
        // Realistic Mock Data for upcoming Indian IPOs since free APIs are unreliable
        setUpcoming([
          { name: 'Oyo Rooms', openDate: 'May 22, 2026', closeDate: 'May 24, 2026', priceBand: '₹120-125', lotSize: '120', gmp: '+12%', subscription: '0.5x' },
          { name: 'Swiggy', openDate: 'May 28, 2026', closeDate: 'May 30, 2026', priceBand: '₹350-370', lotSize: '40', gmp: '+45%', subscription: 'Upcoming' },
          { name: 'Pharmeasy', openDate: 'Jun 05, 2026', closeDate: 'Jun 07, 2026', priceBand: '₹80-85', lotSize: '170', gmp: '+5%', subscription: 'Upcoming' },
        ]);

        // Past IPOs (mock data – you can replace with real API if available)
        setPast([
          { name: 'Tata Technologies', listingDate: 'Nov 28, 2024', issuePrice: '500', listingPrice: '825', gain: '+65%' },
          { name: 'IREDA', listingDate: 'Nov 25, 2024', issuePrice: '32', listingPrice: '46', gain: '+43.75%' },
          { name: 'Gandhar Oil', listingDate: 'Nov 24, 2024', issuePrice: '169', listingPrice: '215', gain: '+27.2%' },
          { name: 'Fedbank Financial', listingDate: 'Nov 22, 2024', issuePrice: '140', listingPrice: '168', gain: '+20%' },
        ]);
      } catch (error) {
        console.error('IPO fetch error:', error);
        setUpcoming([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIPOs();
  }, []);

  if (loading) {
    return <div className="loading">Loading IPO data...</div>;
  }

  return (
    <div>
      <h1>IPO Tracker</h1>
      <div className="section-card">
        <h2>📈 Upcoming IPOs</h2>
        <div className="screener-table">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Open Date</th>
                <th>Close Date</th>
                <th>Price Band</th>
                <th>Lot Size</th>
                <th>GMP</th>
                <th>Subscription</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((ipo, idx) => (
                <tr key={idx}>
                  <td><strong>{ipo.name}</strong></td>
                  <td>{ipo.openDate}</td>
                  <td>{ipo.closeDate}</td>
                  <td>{ipo.priceBand}</td>
                  <td>{ipo.lotSize}</td>
                  <td className="positive">{ipo.gmp}</td>
                  <td className="positive">{ipo.subscription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-card">
        <h2>✅ Recently Listed IPOs (Listing Gains)</h2>
        <div className="screener-table">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Listing Date</th>
                <th>Issue Price</th>
                <th>Listing Price</th>
                <th>Gain %</th>
              </tr>
            </thead>
            <tbody>
              {past.map((ipo, idx) => (
                <tr key={idx}>
                  <td><strong>{ipo.name}</strong></td>
                  <td>{ipo.listingDate}</td>
                  <td>₹{ipo.issuePrice}</td>
                  <td>₹{ipo.listingPrice}</td>
                  <td className="positive">{ipo.gain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}