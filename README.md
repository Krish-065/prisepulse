# 🚀 PrisePulse - Advanced Financial Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node.js-v14+-green)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.4-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/cloud/atlas)

A comprehensive web-based financial intelligence platform with real-time stock tracking, cryptocurrency monitoring, paper trading, AI-powered insights, and advanced portfolio management. Designed for Indian investors and traders.

**🌐 Live App:** [prisepulse-two.vercel.app](https://prisepulse-two.vercel.app)

---

## ✨ Key Features

### 📈 Stock Market Intelligence
- **150+ Indian Stocks**: Complete Nifty 50 + extended list coverage
- **Real-time Data**: Live stock quotes, prices, and market updates
- **Advanced Charts**: 1min to 1year timeframes with technical indicators (SMA, MACD, RSI)
- **Company Information**: News, financials, peer comparison, recommendations
- **Stock Screener**: Advanced filtering (P/E ratio, P/B ratio, dividend yield, sectors)
- **Price Alerts**: Set and manage price notifications with multi-channel delivery

### 💼 Portfolio Management
- **Add Holdings**: Track your stock investments easily
- **Real-time P&L**: Live profit/loss calculation and updates
- **Performance Analytics**: Detailed statistics and insights
- **Export Options**: Download portfolio as PDF or Excel
- **Multi-Watchlist**: Organize stocks in custom watchlists

### 🎮 Paper Trading (Virtual Trading)
- **₹1,00,000 Starting Balance**: Risk-free trading simulation
- **Buy/Sell Execution**: Execute trades with virtual money
- **Performance Metrics**: Track win rate, Sharpe ratio, max drawdown
- **Trade History**: Complete transaction log with analysis
- **Account Reset**: Reset to practice strategies

### 🤖 AI-Powered Insights
- **Market Sentiment Analysis**: Real-time market mood assessment
- **Stock Recommendations**: AI-driven BUY/SELL/HOLD signals
- **Portfolio Analysis**: Smart suggestions for optimization
- **Sector Trends**: Industry-wise market analysis
- **Predictive Analytics**: Market movement predictions

### 💎 Cryptocurrency Tracking
- **16+ Cryptocurrencies**: Bitcoin, Ethereum, and major altcoins
- **Real-time Prices**: INR conversion and live updates
- **Market Trends**: 1h, 24h, 7d performance analysis
- **Crypto Watchlist**: Track your favorite coins

### 📰 News & Market Intelligence
- **Financial News Feed**: Aggregated from top sources
- **Category Filtering**: News by market, crypto, crypto, economics
- **Real-time Updates**: Latest market-moving news
- **Notifications**: Important news alerts

### 🏦 Additional Features
- **IPO Tracker**: Upcoming and recent IPO information
- **Mutual Fund Research**: Compare funds and performance
- **Stock Comparison**: Multi-stock side-by-side analysis
- **Financial Calculators**: SIP, EMI, position sizing, etc.
- **Dark/Light Theme**: Eye-friendly interface options
- **Mobile Responsive**: Perfect on all devices

---

## 🛠️ Technology Stack

### Backend Architecture
```
Node.js + Express.js
├── Authentication: JWT + OAuth2 (Google, Facebook)
├── Database: MongoDB Atlas
├── Real-time: Socket.IO WebSocket
├── APIs: Finnhub, CoinGecko, NewsAPI, Alpha Vantage
└── Notifications: Email/SMS via Nodemailer
```

### Frontend Architecture
```
React 19.2.4 + Tailwind CSS
├── Routing: React Router 7.13.1
├── State: Zustand + Jotai
├── Data Fetching: TanStack Query + Axios
├── Charts: TradingView Lightweight Charts
├── Forms: React Hook Form + Zod
└── Real-time: Socket.IO Client
```

### Database Schema
```
MongoDB Collections:
├── Users (Authentication & Profile)
├── Portfolios (Holdings & Performance)
├── Watchlists (Saved Stocks & Cryptos)
├── PriceAlerts (Price Notification Rules)
├── TradeHistory (Paper Trading Records)
├── TradingAccount (Virtual Account Stats)
├── Notifications (User Notifications)
├── ChatHistory (AI Chat Conversations)
└── ScreenerResults (Saved Screener Runs)
```

---

## 📋 System Requirements

- **Node.js**: v14+ (v18+ recommended)
- **npm**: v6+
- **MongoDB**: Cloud Atlas (free tier available)
- **Modern Browser**: Chrome, Firefox, Safari, Edge

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/prisepulse.git
cd prisepulse
```

### 2. Set Up Environment Variables

**Backend (server/.env)**
```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/prisepulse

# JWT & Security
JWT_SECRET=your_super_secret_key_minimum_32_characters_long

# API Keys
FINNHUB_API_KEY=your_finnhub_api_key
NEWSAPI_KEY=your_newsapi_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
TWELVE_DATA_API_KEY=your_twelve_data_key

# OAuth (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth (Facebook)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Email Service (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Environment
NODE_ENV=development
PORT=5000
```

**Frontend (client/.env.local)**
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Install Dependencies

**Terminal 1 - Backend Setup**
```bash
cd server
npm install
```

**Terminal 2 - Frontend Setup**
```bash
cd client
npm install
```

### 4. Start Development Servers

**Terminal 1 - Backend**
```bash
cd server
npm run dev
# Output: Server running on http://localhost:5000 ✅
```

**Terminal 2 - Frontend**
```bash
cd client
npm start
# Output: Compiled successfully! http://localhost:3000 ✅
```

### 5. Access Application
Open browser and navigate to: **http://localhost:3000**

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| API Routes | 15+ |
| Database Models | 9 |
| React Components | 16+ |
| Custom Hooks | 5 |
| Supported Stocks | 150+ |
| Cryptocurrencies | 16 |
| Pages | 13 |
| Supported Indicators | 10+ |

---

## 🔑 API Key Setup Guide

### Finnhub (Stock Data)
1. Visit [finnhub.io/register](https://finnhub.io/register)
2. Sign up for free account
3. Copy API key from dashboard
4. Add to `.env`: `FINNHUB_API_KEY=your_key`

### CoinGecko (Crypto - No Key Needed)
- Free tier: Unlimited requests
- Already integrated, no setup required

### NewsAPI (News Feed)
1. Visit [newsapi.org](https://newsapi.org/)
2. Register for free
3. Get API key
4. Add to `.env`: `NEWSAPI_KEY=your_key`

### Google OAuth
1. Visit [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "PrisePulse"
3. Enable OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Authorized JavaScript origins: `http://localhost:3000`
6. Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Secret to `.env`

---

## 🗂️ Directory Structure

```
prisepulse/
├── server/                          # Backend
│   ├── config/
│   │   ├── database.js             # MongoDB connection
│   │   └── oauth.js                # OAuth strategies
│   ├── middleware/
│   │   └── auth.js                 # JWT verification
│   ├── models/                     # Database schemas (9 models)
│   ├── routes/                     # API routes (15+ endpoints)
│   ├── services/                   # Business logic (13+ services)
│   ├── utils/                      # Helpers & validators
│   ├── index.js                    # App entry point
│   ├── package.json
│   └── .env
│
├── client/                          # Frontend
│   ├── src/
│   │   ├── hooks/                  # Custom hooks (5)
│   │   ├── services/               # API & Socket (3)
│   │   ├── utils/                  # Formatters & validators (5)
│   │   ├── components/             # React components (16+)
│   │   ├── pages/                  # Page components (13)
│   │   ├── App.js                  # Main app
│   │   └── index.js                # React root
│   ├── package.json
│   └── .env.local
│
├── README.md
├── .gitignore
└── PROJECT_COMPLETION_STATUS.md
```

---

## 🔐 Security Features

✅ **Authentication**
- JWT token-based sessions
- Bcryptjs password hashing
- Google OAuth 2.0 integration
- Facebook OAuth 2.0 integration
- Session timeout & refresh tokens

✅ **Data Protection**
- CORS enabled for security
- Input validation on all endpoints
- SQL injection prevention
- XSS protection with React
- Rate limiting (configurable)

✅ **Privacy**
- Environment variables for secrets
- No sensitive data in frontend
- Secure token storage
- User data encryption

---

## 📱 Responsive Design

- **Mobile (320px+)**: Full functionality, touch-optimized
- **Tablet (768px+)**: Multi-column layouts, enhanced UX
- **Desktop (1024px+)**: Full-featured dashboard experience

---

## 🚢 Deployment Guide

### Deploy Backend (Render.com)
1. Push code to GitHub
2. Visit [render.com](https://render.com)
3. Connect GitHub repository
4. Set environment variables in dashboard
5. Deploy with `npm install && npm run dev`

### Deploy Frontend (Vercel)
1. Visit [vercel.com](https://vercel.com)
2. Import from GitHub
3. Set environment variables
4. Deploy automatically

### Deploy Database (MongoDB Atlas)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster (free tier available)
3. Get connection string
4. Add to backend `.env`

---

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Run linting
npm run lint
```

---

## 🐛 Troubleshooting

### Backend won't start
```
❌ Error: Cannot find module 'nodemon'
✅ Solution: npm install in server/ folder
```

### Frontend compilation error
```
❌ Error: 'react-scripts' is not recognized
✅ Solution: npm install in client/ folder
```

### MongoDB connection failed
```
❌ Error: MongooseError: connect ECONNREFUSED
✅ Solution: Check MONGO_URI in .env, verify MongoDB Atlas is running
```

### API calls failing
```
❌ Error: 404 Not Found
✅ Solution: Verify API key in .env, check route exists
```

---

## 🤝 Contributing

Contributions welcome! 

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License © 2026 PrisePulse. See LICENSE file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- Website: yourwebsite.com

---

## 🙏 Acknowledgments

- **Data Providers**: Finnhub, CoinGecko, NewsAPI, Alpha Vantage
- **Libraries**: React, Express, MongoDB, Socket.IO, Tailwind CSS
- **Icons**: React Icons
- **Charts**: TradingView Lightweight Charts

---

## 📞 Support & Contact

For support, feature requests, or bug reports:
- Open an issue on GitHub
- Email: your.email@example.com
- Discord: [Join our community](https://discord.gg/yourlink)

---

**⭐ If this project helped you, please give it a star!**

**Made with ❤️ for Indian investors and traders**
4. Use **Watchlist** to save your favourite stocks
5. Use **Portfolio** to add your holdings and track P&L
6. Explore **Crypto**, **Mutual Funds**, **News** for market insights
7. Use **Tools** for financial calculations like SIP returns, position sizing, brokerage charges

> **Note:** The backend is hosted on Render free tier. If the app takes 30-50 seconds to load for the first time, it is waking up from sleep. Subsequent requests will be instant.

---

## Limitations

- No email OTP verification — users can register with any email without confirming it is real or belongs to them
- No password strength enforcement — any password is accepted including very weak ones like "123" or "password"

---



---

## Project Structure

```
prisepulse/
├── client/                 # React frontend
│   └── src/
│       ├── components/
│       │   └── Navbar.jsx
│       └── pages/
│           ├── Markets.jsx
│           ├── Portfolio.jsx
│           ├── Watchlist.jsx
│           ├── Crypto.jsx
│           ├── MutualFunds.jsx
│           ├── News.jsx
│           ├── Tools.jsx
│           └── Login.jsx
└── server/                 # Node.js backend
    ├── models/
    │   ├── User.js
    │   ├── Portfolio.js
    │   └── Watchlist.js
    ├── routes/
    │   ├── auth.js
    │   ├── market.js
    │   ├── portfolio.js
    │   ├── watchlist.js
    │   └── news.js
    └── index.js
```

---

