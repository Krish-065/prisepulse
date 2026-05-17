<div align="center">

# 📈 PrisePulse

### *Your Professional Financial Dashboard for Indian Markets*

[![🚀 Launch App](https://img.shields.io/badge/🚀%20Launch%20App-prisepulse--nine.vercel.app-00ff88?style=for-the-badge)](https://prisepulse-nine.vercel.app/)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)]()
[![Market](https://img.shields.io/badge/Market-NSE%20%7C%20BSE%20%7C%20Crypto-blue?style=for-the-badge)]()

> **PrisePulse** is a full-stack, real-time financial intelligence platform built for Indian retail investors and traders. Track live markets, manage your portfolio, paper-trade risk-free, screen stocks, and use professional financial calculators — all in one place.

### 🌐 [https://prisepulse-nine.vercel.app/](https://prisepulse-nine.vercel.app/)

</div>

---

## 🖥️ What is PrisePulse?

PrisePulse is a **web-based financial platform** designed to give Indian retail traders and investors the same tools used by professionals — without any cost. It aggregates live market data from multiple sources and presents it in a clean, modern interface with dark/light theme support.

Whether you're a beginner learning how markets work through paper trading, an investor tracking your holdings, or a trader scanning for opportunities with the stock screener — PrisePulse has something for you.

---

## ✨ Features at a Glance

### 📊 Live Market Dashboard
Real-time prices and changes for **NIFTY 50, SENSEX, BANK NIFTY, and NIFTY IT** — auto-refreshed every 15 seconds. The dashboard also shows:
- **Top 10 Gainers & Top 10 Losers** from NIFTY 50
- **Live Ticker Bar** scrolling across the top of every page
- **Market News** feed from financial news sources
- **Universal Search Bar** — search any stock, index, or crypto and jump to its chart instantly

---

### 📈 Markets Explorer (Interactive Charts)
Full-featured **TradingView candlestick charts** for any tradeable asset:

| Asset Class | Examples |
|---|---|
| Indian Indices | SENSEX, BANK NIFTY |
| NSE Stocks | RELIANCE, TCS, INFY, HDFC BANK |
| Cryptocurrency | Bitcoin, Ethereum, Solana |
| Forex | USD/INR, EUR/INR |
| Commodities | Gold, Silver, Crude Oil |

Use the quick-select pill buttons or search any symbol to instantly load its chart.

---

### 🔍 Stock Screener
A **professional-grade screener** showing 20 major NIFTY 50 stocks with live data, auto-refreshing every 30 seconds:

| Column | Description |
|---|---|
| Company | Symbol + Exchange |
| Sector | IT / Banking / FMCG / Auto / Infra |
| Price (₹) | Live last traded price |
| 1D | Today's percentage change |
| 1W | Estimated 1-week movement |
| 1M | Estimated 1-month movement |
| Volume | Trading volume |
| P/E | Price-to-Earnings ratio |
| P/B | Price-to-Book ratio |
| ROE | Return on Equity |
| Div | Dividend yield |

Filter by **All / Top Gainers / Top Losers**. Use the search bar with live suggestions to find any stock instantly. A **LIVE badge** and timestamp show exactly when data was last fetched, with a manual refresh button.

---

### 💼 Portfolio Manager
Track all your real investments in one dashboard:
- Add any **stock, index, ETF, forex, or crypto** to your portfolio
- See **live P&L** (profit or loss) calculated against the current market price
- View **average buy price, current price, gain/loss %** for each holding
- **Remove any holding** with one click
- Portfolio is **saved to your account** and persists across sessions

---

### 👁️ Watchlist
Your personal market watch:
- **Search and add** any tradable asset using the intelligent search with live dropdown suggestions
- Each item shows **live LTP, Change (₹), and Change %**
- **Remove** any symbol with a single click
- Synced to your account across devices

---

### 📰 IPO Tracker

**Upcoming IPOs:**
- Company name, open & close dates, price band, lot size, GMP (Grey Market Premium), subscription status

**Recently Listed IPOs:**
- Company, listing date, issue price, listing price, and listing gain %

---

### 📊 Futures & Options (F&O)
- **Live NIFTY FUT and BANKNIFTY FUT** prices with Open Interest — auto-refreshes every 15 seconds
- **Put-Call Ratio (PCR)** — indicates overall market bullish/bearish sentiment
- **NIFTY Option Chain** — Strike prices with CE OI, CE Δ, PE OI, PE Δ; ATM strike highlighted

---

### 🪙 Cryptocurrency (20 Coins)
Live prices for the top 20 cryptocurrencies with logos, USD pricing, and 24h change:

`BTC · ETH · BNB · SOL · XRP · DOGE · ADA · SHIB · AVAX · TRX · DOT · BCH · LINK · MATIC · LTC · NEAR · TON · USDT · USDC · UNI`

Auto-refreshes every 60 seconds.

---

### 📉 Paper Trading Simulator
Trade with virtual ₹1,00,000 — practice without risking real money:
- **Search any stock or crypto** using the live suggestions dropdown
- Orders execute at the **current real-time market price** from the backend
- Track **quantity, average buy price, and current holdings value**
- **BUY and SELL** orders supported
- **Reset portfolio** anytime to start fresh

---

### 🛠️ Financial Calculators (8 Tools)

| Calculator | Use Case |
|---|---|
| **SIP** | How much will your monthly SIP grow to? |
| **Lumpsum** | How much will a one-time investment become? |
| **EMI / Loan** | What is your monthly EMI and total interest? |
| **Brokerage** | What are total charges on your trade (brokerage, STT, net profit)? |
| **Position Sizing** | How many shares to buy to limit risk to X% of capital? |
| **Compound Interest** | Grow principal with custom compounding frequency |
| **Margin Calculator** | How much margin do you need for a leveraged position? |
| **Absolute Returns** | What is your profit % between any buy and sell price? |

Clean sidebar navigation + results displayed with green highlights for profit fields.

---

## 🔄 Data Flow & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│         React 18 + Vite  (Hosted on Vercel)                 │
│                                                             │
│  Dashboard  │  Screener  │  Portfolio  │  Tools  │  Crypto  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST API + Socket.io
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               EXPRESS.JS BACKEND  (Hosted on Render)        │
│                                                             │
│  Auth Routes  │  Market Routes  │  Portfolio/Watchlist API  │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │  JWT Auth Layer  │    │  Rate Limiter    │               │
│  └─────────────────┘    └──────────────────┘               │
└──────────┬──────────────────────┬────────────────────────── ┘
           │                      │
           ▼                      ▼
  ┌────────────────┐   ┌──────────────────────────────────┐
  │  PostgreSQL DB  │   │     External Data Sources        │
  │  (Neon/Cloud)  │   │                                  │
  │                │   │  Yahoo Finance API  → Stocks,     │
  │  • Users       │   │    Indices, Crypto, Forex         │
  │  • Portfolio   │   │                                  │
  │  • Watchlist   │   │  TradingView Widget → Charts      │
  │  • Sessions    │   │                                  │
  └────────────────┘   │  NewsAPI → Market News           │
                       └──────────────────────────────────┘
```

### Live Data Refresh Intervals

| Module | Refresh Rate |
|---|---|
| Dashboard Indices | Every 15 seconds |
| Top Gainers / Losers | Every 15 seconds |
| Stock Screener | Every 30 seconds |
| Crypto Prices | Every 60 seconds |
| F&O Futures | Every 15 seconds |
| Watchlist Prices | On page load |

---

## 🛠️ Tools & Technologies Used

### Frontend Stack
| Tool | Role |
|---|---|
| **React 18** | Component-based UI framework |
| **Vite** | Blazing-fast build tool |
| **React Router v6** | SPA page routing |
| **Axios** | API request handling |
| **TradingView Widget** | Embeddable professional charts |
| **Vanilla CSS + CSS Variables** | Theming, glassmorphism, animations |
| **Google Fonts (Inter)** | Modern typography |

### Backend Stack
| Tool | Role |
|---|---|
| **Node.js + Express** | REST API server |
| **Socket.io** | Real-time WebSocket support |
| **PostgreSQL** | Persistent data (users, portfolio, watchlist) |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcrypt** | Secure password hashing |
| **Helmet.js** | Secure HTTP headers |
| **express-rate-limit** | Brute-force login protection |

### External Data Sources
| Source | Data Provided |
|---|---|
| **Yahoo Finance API** | Live stock, index, crypto, forex prices |
| **TradingView Widget** | Interactive candlestick charts |
| **NewsAPI** | Financial news headlines |
| **CoinCap** | Cryptocurrency logo images |

### Hosting & Infrastructure
| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting + global CDN |
| **Render** | Backend Node.js server hosting |
| **Neon (PostgreSQL)** | Managed cloud database |
| **GitHub** | Source control and CI/CD |

---

## ✅ Pros & Strengths

- 🟢 **No cost** — completely free to use at [prisepulse-nine.vercel.app](https://prisepulse-nine.vercel.app/)
- 🟢 **Real-time data** — live market prices refreshed automatically, not delayed end-of-day data
- 🟢 **All-in-one** — market data, portfolio, screener, paper trading, calculators in one app
- 🟢 **Indian-market focused** — NSE/BSE stocks, NIFTY/SENSEX indices, INR pricing
- 🟢 **Account-based** — your portfolio and watchlist are saved securely to your account
- 🟢 **Professional charts** — TradingView-powered candlestick charts for any asset
- 🟢 **Paper Trading** — learn to trade risk-free with a virtual ₹1 Lakh portfolio
- 🟢 **Broad asset coverage** — Stocks, Indices, Crypto, Forex, Commodities
- 🟢 **Secure** — JWT auth, bcrypt hashing, rate limiting, SQL injection prevention
- 🟢 **Dark & Light theme** — full glassmorphism design that adapts to your preference

---

## ⚠️ Limitations

- 🔴 **Yahoo Finance rate limits** — on heavy traffic days, some prices may show delayed or missing; data refreshes automatically on next cycle
- 🔴 **No real brokerage integration** — paper trading is simulated, not connected to Zerodha, Upstox, or any broker
- 🔴 **News requires API key** — the market news feed requires a NewsAPI key configured server-side; without it the news section will be empty
- 🔴 **IPO data is approximate** — upcoming IPO data is curated manually; real-time GMP and live subscription data is not scraped automatically
- 🔴 **F&O option chain is illustrative** — real NSE option chain OI data requires a paid data feed; current values are indicative
- 🔴 **Render free tier cold starts** — the backend may take 30–60 seconds to wake up if it hasn't been used recently
- 🔴 **No price alerts yet** — setting notifications for target prices is on the roadmap but not yet live
- 🔴 **Mobile layout** — the app is optimized for desktop/tablet; mobile sidebar is functional but not fully responsive

---

## 🔐 Your Data & Security

- All passwords are **hashed with bcrypt** — never stored in plain text
- Authentication uses **short-lived JWT tokens** — your session is stateless and secure
- Login attempts are **rate-limited** — brute-force attacks are blocked after 5 failed attempts
- **CORS is restricted** — only the official frontend domain can call the backend
- **Database queries use parameterization** — SQL injection is not possible

---

<div align="center">

## 🚀 Start Using PrisePulse

### **[https://prisepulse-nine.vercel.app/](https://prisepulse-nine.vercel.app/)**

*Create a free account in seconds. No credit card. No installs.*

---

Built with ❤️ for Indian retail traders and investors

[🐛 Report an Issue](https://github.com/Krish-065/prisepulse/issues) · [✨ Suggest a Feature](https://github.com/Krish-065/prisepulse/issues)

</div>

