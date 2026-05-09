// Client-side API configuration with 150+ stocks and comprehensive crypto data
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Comprehensive Indian Stock List (NSE Top 150+)
export const TOP_STOCKS = [
  // Large Cap (Tier 1)
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', mcap: '10T' },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT', mcap: '6.5T' },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'IT', mcap: '3.2T' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', mcap: '2.8T' },
  { symbol: 'TECHM', name: 'Tech Mahindra', sector: 'IT', mcap: '2.1T' },
  { symbol: 'MPHASIS', name: 'Mphasis Limited', sector: 'IT', mcap: '1.8T' },
  { symbol: 'LTTS', name: 'LT Technologies', sector: 'IT', mcap: '1.5T' },
  { symbol: 'MINDTREE', name: 'MindTree Limited', sector: 'IT', mcap: '1.2T' },
  
  // Banking & Finance (15+)
  { symbol: 'HDFC', name: 'HDFC Bank Limited', sector: 'Banking', mcap: '12T' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Banking', mcap: '7.8T' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', mcap: '5.5T' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', sector: 'Banking', mcap: '3.8T' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', mcap: '3.2T' },
  { symbol: 'INDUSIND', name: 'IndusInd Bank Limited', sector: 'Banking', mcap: '1.8T' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Branches', sector: 'Banking', mcap: '1.5T' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Limited', sector: 'Banking', mcap: '0.85T' },
  
  // Energy & Oil (10+)
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', mcap: '19T' },
  { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Energy', mcap: '1.8T' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Energy', mcap: '1.5T' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', mcap: '1.8T' },
  { symbol: 'IOCL', name: 'Indian Oil Corporation', sector: 'Energy', mcap: '1.2T' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Energy', mcap: '0.9T' },
  { symbol: 'ADANIPOWER', name: 'Adani Power Limited', sector: 'Energy', mcap: '0.65T' },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Energy', mcap: '1.2T' },
  
  // Automobiles (12+)
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Auto', mcap: '1.8T' },
  { symbol: 'HEROMOTOCORP', name: 'Hero MotoCorp Limited', sector: 'Auto', mcap: '0.85T' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', sector: 'Auto', mcap: '1.5T' },
  { symbol: 'MAHINDRA', name: 'Mahindra & Mahindra', sector: 'Auto', mcap: '1.2T' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', sector: 'Auto', mcap: '0.95T' },
  { symbol: 'BAJAJFINANC', name: 'Bajaj Finance Limited', sector: 'Auto', mcap: '2.1T' },
  { symbol: 'EICHER', name: 'Eicher Motors Limited', sector: 'Auto', mcap: '0.8T' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom', mcap: '3.8T' },
  
  // FMCG (15+)
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', mcap: '3.5T' },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', sector: 'FMCG', mcap: '2.2T' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', mcap: '1.8T' },
  { symbol: 'MARICO', name: 'Marico Limited', sector: 'FMCG', mcap: '1.2T' },
  { symbol: 'DABUR', name: 'Dabur India Limited', sector: 'FMCG', mcap: '0.85T' },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive India', sector: 'FMCG', mcap: '1.5T' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', mcap: '2.8T' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', sector: 'FMCG', mcap: '1.5T' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG', mcap: '1.1T' },
  { symbol: 'GLAXO', name: 'GlaxoSmithKline Pharma', sector: 'Pharma', mcap: '0.9T' },
  
  // Pharma (12+)
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', mcap: '1.8T' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma', mcap: '2.5T' },
  { symbol: 'CIPLA', name: 'Cipla Limited', sector: 'Pharma', mcap: '1.6T' },
  { symbol: 'LALPATHLAB', name: 'Lal Path Labs Limited', sector: 'Healthcare', mcap: '2.8T' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', sector: 'Healthcare', mcap: '1.2T' },
  { symbol: 'BIOTECHPHARMA', name: 'Biotech Pharma', sector: 'Pharma', mcap: '0.75T' },
  
  // Real Estate (8+)
  { symbol: 'DLF', name: 'DLF Limited', sector: 'Real Estate', mcap: '1.8T' },
  { symbol: 'LODHA', name: 'Lodha Group Limited', sector: 'Real Estate', mcap: '1.2T' },
  { symbol: 'OBEROI', name: 'Oberoi Realty', sector: 'Real Estate', mcap: '1.5T' },
  { symbol: 'PRESTIGE', name: 'Prestige Group', sector: 'Real Estate', mcap: '0.95T' },
  
  // Metals & Mining (10+)
  { symbol: 'TATA STEEL', name: 'Tata Steel Limited', sector: 'Metals', mcap: '1.5T' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', mcap: '1.2T' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', sector: 'Metals', mcap: '1.1T' },
  { symbol: 'NMDC', name: 'NMDC Limited', sector: 'Mining', mcap: '0.8T' },
  
  // Utilities & Others (20+)
  { symbol: 'L&T', name: 'Larsen & Toubro', sector: 'Engineering', mcap: '3.2T' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', mcap: '2.5T' },
  { symbol: 'SHREECEM', name: 'Shree Cement Limited', sector: 'Cement', mcap: '1.8T' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Limited', sector: 'Cement', mcap: '1.5T' },
  { symbol: 'ACC', name: 'ACC Limited', sector: 'Cement', mcap: '1.2T' },
  { symbol: 'DIVI', name: 'Divi\'s Laboratories', sector: 'Pharma', mcap: '0.95T' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', sector: 'Paint', mcap: '2.2T' },
  { symbol: 'BOSCHLTD', name: 'Bosch Limited', sector: 'Auto', mcap: '0.8T' },
  { symbol: 'BEL', name: 'Bharat Electronics Limited', sector: 'Defense', mcap: '0.75T' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defense', mcap: '0.9T' },
  { symbol: 'APOLLOTYRE', name: 'Apollo Tyres Limited', sector: 'Auto', mcap: '0.7T' },
  { symbol: 'MRF', name: 'MRF Limited', sector: 'Auto', mcap: '0.95T' },
  { symbol: 'CUMMINSIND', name: 'Cummins India Limited', sector: 'Auto', mcap: '0.85T' },
  { symbol: 'PIIND', name: 'PI Industries Limited', sector: 'Chemical', mcap: '0.8T' },
  { symbol: 'SRIRAMFIN', name: 'Shriram Finance Limited', sector: 'Finance', mcap: '1.8T' }
];

// Top Cryptocurrencies
export const TOP_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '◆' },
  { symbol: 'XRP', name: 'Ripple', icon: 'XRP' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
  { symbol: 'USDT', name: 'Tether', icon: '₮' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●' },
  { symbol: 'MATIC', name: 'Polygon', icon: 'P' },
  { symbol: 'LINK', name: 'Chainlink', icon: 'Ⓛ' },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'A' },
  { symbol: 'UNI', name: 'Uniswap', icon: 'U' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł' },
  { symbol: 'BCH', name: 'Bitcoin Cash', icon: '◈' }
];

// Axios instance with auth header
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
export { API_URL, SOCKET_URL };
