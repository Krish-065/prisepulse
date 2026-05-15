import { useState, useEffect } from 'react';
import axios from 'axios';

export default function IPOs() {
  const [upcomingIPOs, setUpcomingIPOs] = useState([]);
  const [pastIPOs, setPastIPOs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIPOs = async () => {
      try {
        // Fetch upcoming IPOs
        const upRes = await axios.get('https://api.chittorgarh.com/api/v1/ipos/upcoming');
        if (upRes.data && upRes.data.length) {
          setUpcomingIPOs(upRes.data.slice(0, 15).map(ipo => ({
            name: ipo.company_name,
            openDate: ipo.open_date,
            closeDate: ipo.close_date,
            priceBand: `₹${ipo.price_band_lower} - ₹${ipo.price_band_upper}`,
            lotSize: ipo.lot_size,
            gmp: ipo.gmp ? `+${ipo.gmp}%` : 'N/A',
            subscription: ipo.subscription || '0x'
          })));
        }

        // Fetch past IPOs (from a separate endpoint or mock)
        // Chittorgarh also has a "listed" endpoint; we'll use mock for now but you can replace with real API
        setPastIPOs([
          { name: 'Tata Technologies', listingDate: 'Nov 28, 2024', issuePrice: '500', listingPrice: '825', gain: '+65%' },
          { name: 'IREDA', listingDate: 'Nov 25, 2024', issuePrice: '32', listingPrice: '46', gain: '+43.75%' },
          { name: 'Gandhar Oil', listingDate: 'Nov 24, 2024', issuePrice: '169', listingPrice: '215', gain: '+27.2%' },
          { name: 'Fedbank Financial', listingDate: 'Nov 22, 2024', issuePrice: '140', listingPrice: '168', gain: '+20%' },
          { name: 'Muthoot Microfin', listingDate: 'Nov 20, 2024', issuePrice: '305', listingPrice: '335', gain: '+9.8%' },
          { name: 'Inox India', listingDate: 'Nov 18, 2024', issuePrice: '660', listingPrice: '710', gain: '+7.6%' },
          { name: 'DOMS Industries', listingDate: 'Dec 20, 2024', issuePrice: '790', listingPrice: '850', gain: '+7.6%' }
        ]);
      } catch (error) {
        console.error('IPO fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIPOs();
  }, []);

  return (
    <div className="ipo-page">
      <h1>IPO Tracker</h1>
      <p>Upcoming IPOs with GMP & subscription – Past IPO listing gains</p>

      {loading ? (
        <div>Loading IPO data...</div>
      ) : (
        <>
          <div className="ipo-section">
            <h2>📈 Upcoming IPOs</h2>
            <div className="ipo-table">
              <table>
                <thead><tr><th>Company</th><th>Open Date</th><th>Close Date</th><th>Price Band</th><th>Lot Size</th><th>GMP</th><th>Subscription</th></tr></thead>
                <tbody>
                  {upcomingIPOs.map((ipo, idx) => (
                    <tr key={idx}>
                      <td><strong>{ipo.name}</strong></td>
                      <td>{ipo.openDate}</td><td>{ipo.closeDate}</td><td>{ipo.priceBand}</td>
                      <td>{ipo.lotSize}</td><td className="positive">{ipo.gmp}</td><td className="positive">{ipo.subscription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ipo-section">
            <h2>✅ Recently Listed IPOs (Listing Gains)</h2>
            <div className="ipo-table">
              <table>
                <thead><tr><th>Company</th><th>Listing Date</th><th>Issue Price</th><th>Listing Price</th><th>Gain %</th></tr></thead>
                <tbody>
                  {pastIPOs.map((ipo, idx) => (
                    <tr key={idx}>
                      <td><strong>{ipo.name}</strong></td><td>{ipo.listingDate}</td><td>₹{ipo.issuePrice}</td>
                      <td>₹{ipo.listingPrice}</td><td className="positive">{ipo.gain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        .ipo-page { padding: 20px; }
        .ipo-section { background: var(--bg-card); border-radius: 16px; padding: 24px; margin-bottom: 32px; }
        .ipo-table { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
        .positive { color: #00ff88; }
      `}</style>
    </div>
  );
}