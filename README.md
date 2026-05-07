# PrisePulse 📈

A full-stack real-time financial intelligence web application inspired by MoneyControl — built for Indian investors to track stocks, crypto, mutual funds, and manage portfolios.

🌐 **Live App:** [prisepulse-two.vercel.app](https://prisepulse-two.vercel.app)  
---

## What It Does

- **Live Market Data** — NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT updating every 10 seconds via WebSocket
- **Top Gainers & Losers** — Real Nifty 50 stock movement with price, change %, and trading volume
- **Intraday Chart** — NIFTY 50 price chart for the current trading session
- **Crypto Markets** — Top 15 coins with live INR prices, 1h/24h/7d change via CoinGecko
- **Mutual Funds** — Live NAV for top Indian funds directly from AMFI India
- **Market News** — Real financial news from Economic Times, Moneycontrol, Business Standard
- **Portfolio Tracker** — Add stocks with buy price and quantity, track real-time P&L
- **Watchlist** — Personal stock watchlist saved to your account
- **Financial Tools** — 7 calculators: Position Size, SIP, Brokerage, EMI, Compound Interest, Margin, Returns
- **Authentication** — Secure signup/login with JWT tokens and bcrypt password hashing
- **Market Status** — Live indicator showing if NSE/BSE is currently open or closed

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React.js, Tailwind CSS, Recharts, Socket.io Client, Axios, React Router DOM |
| Backend | Node.js, Express.js, Socket.io, Node-cron, Mongoose, JWT, Bcryptjs |
| Database | MongoDB Atlas |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| NSE India | Live NIFTY, gainers, losers, intraday charts | Free |
| CoinGecko | Crypto prices in INR | Free |
| mfapi.in | Indian mutual fund NAV from AMFI | Free, unlimited |
| NewsAPI.org | Real financial news articles | Free, 100/day |

---

## How to Use

1. Visit [prisepulse-two.vercel.app](https://prisepulse-two.vercel.app)
2. Browse the **Markets** page for live NIFTY/SENSEX data — no login required
3. Click **Sign Up** to create a free account
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

