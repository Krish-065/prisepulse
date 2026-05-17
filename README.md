<div align="center">

# 📈 PrisePulse

### *Professional Financial Platform for Indian Markets*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00ff88?style=for-the-badge&logo=vercel)](https://prisepulse-nine.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://prisepulse.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)

*A full-stack, real-time financial dashboard built for Indian stock markets — featuring live prices, paper trading, F&O analysis, crypto tracking, a stock screener, and professional financial calculators.*

</div>

---

## 🌟 Features

### 📊 Live Market Data
- **NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT** — real-time index prices from Yahoo Finance
- **Top Gainers & Top Losers** — refreshes every 15 seconds automatically
- **Live Ticker** — scrolling market ticker at the top of every page
- **Market News** — latest financial news via NewsAPI

### 📈 Markets Explorer
- **Interactive TradingView Charts** — full candlestick charts for any stock, index, crypto, or forex
- **Quick Symbols** — NIFTY, SENSEX, BANK NIFTY, RELIANCE, TCS, BTC, ETH, Gold, Crude Oil, USD/INR, EUR/INR
- **Universal Search** — type any symbol and load its chart instantly

### 🔍 Stock Screener
- **20 NIFTY 50 Stocks** — live data with auto-refresh every 30 seconds
- **Advanced Table** — Symbol, Sector, Price, 1D/1W/1M performance, Volume, P/E, P/B, ROE, Dividend
- **Filters** — All / Top Gainers / Top Losers
- **Search** — search any symbol with live suggestions dropdown
- **Last Updated timestamp** + manual Refresh button

### 💼 Portfolio Management
- **Add Holdings** — search any stock, forex, index, or crypto and add to your portfolio
- **Live P&L** — real-time profit/loss calculation against live market prices
- **Remove Holdings** — delete any position instantly
- **Authenticated** — portfolio data is saved per user in PostgreSQL

### 👁️ Watchlist
- **Add any asset** — stocks, indices, crypto, forex via search suggestions
- **Live Prices** — every watchlist item shows live LTP, change, and change %
- **Remove** — one-click removal

### 📰 IPO Tracker
- **Upcoming IPOs** — company name, open/close dates, price band, lot size, GMP, subscription
- **Recently Listed** — listing gains with issue price vs listing price

### 📊 Futures & Options (F&O)
- **Live Futures Prices** — NIFTY FUT and BANKNIFTY FUT with live OI
- **Put-Call Ratio (PCR)** — market sentiment indicator
- **NIFTY Option Chain** — Strike, CE OI, CE Δ, PE OI, PE Δ with ATM strike highlighted
- **Auto-refresh** every 15 seconds

### 🪙 Cryptocurrency
- **20 Major Cryptos** — BTC, ETH, BNB, SOL, XRP, DOGE, ADA, SHIB, AVAX, TRX, DOT, BCH, LINK, MATIC, LTC, NEAR, TON, USDT, USDC, UNI
- **Live USD prices** via Yahoo Finance
- **Crypto logo images** for each coin
- **Auto-refresh** every 60 seconds

### 📉 Paper Trading
- **Virtual ₹1,00,000 Balance** — practice trading risk-free
- **Live Price Execution** — orders execute at real-time market price fetched from backend
- **Search Suggestions** — find any stock/crypto to trade
- **Holdings Tracker** — quantity, average price, current holdings value
- **Reset Portfolio** — start fresh anytime

### 🛠️ Financial Tools (8 Calculators)
| Calculator | What it computes |
|---|---|
| **SIP** | Future value, invested amount, returns for monthly SIP |
| **Lumpsum** | Total amount and profit for one-time investment |
| **EMI / Loan** | Monthly EMI, total payment, interest paid |
| **Brokerage** | Brokerage, STT, total charges, net profit |
| **Position Sizing** | Quantity of shares and actual risk based on stop-loss |
| **Compound Interest** | Total value and interest earned with configurable compounding frequency |
| **Margin Calculator** | Total trade value and margin required for leveraged trading |
| **Absolute Returns** | Profit/loss and return % for any buy/sell pair |

### 🎨 Design & UX
- **Dark / Light Theme Toggle** — full glassmorphism design in both themes
- **Animated Candlestick Background** — subtle SVG pattern on every page
- **Inter Font** — modern, professional typography
- **Micro-animations** — hover effects, live badge pulse, smooth transitions
- **Responsive** — works on desktop and tablet

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **TradingView Widget** | Interactive financial charts |
| **React Hot Toast** | Notification toasts |
| **Vanilla CSS** | Styling with CSS variables and glassmorphism |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **PostgreSQL** | User data, watchlist, portfolio |
| **Socket.io** | Real-time WebSocket layer |
| **JWT** | Stateless authentication tokens |
| **bcrypt** | Password hashing |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Login brute-force protection |
| **Yahoo Finance API** | Live stock, index, and crypto prices |
| **NewsAPI** | Financial news feed |

### Infrastructure
| Service | Role |
|---|---|
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |
| **Neon / Supabase** | Managed PostgreSQL database |

---



## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/auth/forgot-password` | Send password reset email |
| `POST` | `/api/auth/reset-password` | Reset password with token |
| `POST` | `/api/auth/verify-email` | Verify email address |

### Market Data
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/market/indices` | NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT |
| `GET` | `/api/market/movers` | Top gainers and losers |
| `GET` | `/api/market/stock/:symbol` | Quote for any symbol |
| `GET` | `/api/market/stock-list` | Full NIFTY 50 stock list with live data |
| `GET` | `/api/market/search/:query` | Search stocks, indices, crypto, forex |
| `GET` | `/api/market/crypto` | Top 20 cryptocurrencies |
| `GET` | `/api/market/futures` | NIFTY and BANKNIFTY futures data |
| `GET` | `/api/market/news` | Latest financial news |

### Portfolio & Watchlist *(requires auth)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/watchlist` | Get user's watchlist |
| `POST` | `/api/watchlist` | Add symbol to watchlist |
| `DELETE` | `/api/watchlist/:symbol` | Remove from watchlist |
| `GET` | `/api/portfolio` | Get user's portfolio |
| `POST` | `/api/portfolio` | Add holding to portfolio |
| `DELETE` | `/api/portfolio/:symbol` | Remove holding from portfolio |

---

## 📁 Project Structure

```
prisepulse/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── marketData.js       # Yahoo Finance integration
│   │   ├── auth/
│   │   │   └── auth.service.js     # JWT auth, registration, login
│   │   ├── db/
│   │   │   ├── index.js            # PostgreSQL connection pool
│   │   │   └── schema.js           # Table creation SQL
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification middleware
│   │   │   └── rateLimit.js        # Login rate limiter
│   │   └── index.js                # Express app, routes, Socket.io
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CandlestickBg.jsx   # Animated SVG background
    │   │   ├── Layout.jsx          # App shell with sidebar
    │   │   ├── PrivateRoute.jsx    # Auth guard
    │   │   ├── SearchWithSuggestions.jsx  # Live search dropdown
    │   │   └── Sidebar.jsx         # Navigation sidebar
    │   ├── contexts/
    │   │   ├── AuthContext.jsx     # Auth state & JWT handling
    │   │   └── ThemeContext.jsx    # Dark/Light theme
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Live market overview
    │   │   ├── Markets.jsx         # TradingView charts
    │   │   ├── Screener.jsx        # Stock screener table
    │   │   ├── Portfolio.jsx       # Portfolio with live P&L
    │   │   ├── Watchlist.jsx       # Personal watchlist
    │   │   ├── Trading.jsx         # Paper trading simulator
    │   │   ├── Crypto.jsx          # Crypto market page
    │   │   ├── FnO.jsx             # Futures & Options
    │   │   ├── IPOs.jsx            # IPO tracker
    │   │   ├── News.jsx            # Financial news
    │   │   ├── Tools.jsx           # 8 financial calculators
    │   │   ├── Login.jsx           # Auth — login
    │   │   └── Register.jsx        # Auth — registration
    │   ├── services/
    │   │   └── api.js              # Axios client with base URL config
    │   └── index.css               # Global styles, CSS variables, themes
    └── package.json
```

---

## 🔐 Security

- **JWT authentication** — tokens expire after 7 days
- **bcrypt password hashing** — 10 salt rounds
- **Rate limiting** — 5 login attempts per 15 minutes
- **Helmet.js** — sets secure HTTP headers
- **CORS** — restricted to the configured frontend domain
- **Parameterized SQL queries** — no raw string interpolation (SQL injection safe)

---

## 📦 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS |
| `NEWS_API_KEY` | ⚠️ Optional | [newsapi.org](https://newsapi.org) API key |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL (must end with `/api`) |

---

## 🚢 Deployment

### Frontend → Vercel
1. Import the GitHub repo into [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy

### Backend → Render
1. Create a **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`
6. Deploy

---

## 🛣️ Roadmap

- [ ] Real-time WebSocket price streaming
- [ ] Price alerts & push notifications
- [ ] Export portfolio as PDF / Excel
- [ ] Technical indicators overlay (SMA, RSI, MACD)
- [ ] Mutual Funds NAV tracking
- [ ] 2FA (Two-Factor Authentication) via TOTP
- [ ] Mobile-responsive sidebar
- [ ] XIRR / CAGR return calculators
- [ ] AI-powered stock recommendations

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Indian markets**

[🌐 Live Demo](https://prisepulse-nine.vercel.app) · [🐛 Report Bug](https://github.com/Krish-065/prisepulse/issues) · [✨ Request Feature](https://github.com/Krish-065/prisepulse/issues)

</div>
