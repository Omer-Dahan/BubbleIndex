# BubbleIndex

A systemic market risk visualization platform for the US stock market. **BubbleIndex** monitors 125 years of financial data to calculate a composite Risk Score (0–100), comparing current market conditions against historical crisis periods and tracking five key risk dimensions.

<div align="center">

**[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Risk Methodology](#risk-methodology) • [API Endpoints](#api-endpoints) • [Configuration](#configuration)**

</div>

---

## Features

### 📊 Six Interactive Screens
1. **Home Dashboard** — Live composite Risk Score with category breakdown and AI-powered summary.
2. **Market Replay** — 125-year historical timeline with interactive crisis markers (1929, 1973, 1987, 2000, 2008, 2020).
3. **Indicators Explorer** — 6×24-month heatmap of all risk indicators with trend analysis.
4. **Crisis Similarity** — Real-time comparison against 5 historical crisis profiles using cosine similarity.
5. **AI Insights** — Radar chart analysis and narrative risk assessment.
6. **Methodology & Status** — Full documentation of weights, formulas, data sources, and API status.

### 🎯 Risk Scoring System
- **Weighted composite** across 5 categories: Valuation (30%), Macro Stress (20%), Leverage/Credit (20%), Sentiment (15%), Concentration (15%).
- **Percentile normalization** against 20 years of historical data using SciPy.
- **Historical crisis comparison** via cosine similarity vector math.
- **Three-tier robust fallback** system: Fresh API Data → Stale Cache → Neutral Imputation (50.0).

### 🎨 Design System
- **Charcoal dark theme** with a temperature-based color scale (9 steps: stable → bubble).
- **Responsive density modes** (compact, comfortable, spacious).
- **Multiple color palettes** (temperature, traffic, violet, monochrome).
- **Accessible typography** with Inter & Barlow Condensed fonts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Framer Motion |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Alembic, Pandas, NumPy, SciPy, Background Tasks (APScheduler) |
| **Data Sources** | FRED API, yfinance, Finnhub API, DBnomics, Multpl, Shiller Data |
| **Database** | SQLite (optimized with WAL mode) |
| **Cache** | Local JSON File Cache with individual TTLs per data source |
| **Deployment** | Vercel (Frontend), Ubuntu/WSL (Backend) |

---

## Quick Start

### Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **FRED API Key** (free from [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/))
- **Finnhub API Key** (free from [finnhub.io](https://finnhub.io))

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Omer-Dahan/BubbleIndex.git
cd BubbleIndex
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows PowerShell: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your FRED_API_KEY and FINNHUB_API_KEY
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Ensure NEXT_PUBLIC_BACKEND_URL is set to http://localhost:8000
```

#### 4. Run Locally

**Start the Backend (Port 8000)**
```bash
cd backend
python run.py
```
*On first startup, the database bootstraps historical data. This may take ~30–60 seconds.*

**Start the Frontend (Port 3000)**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Frontend (Next.js 14 + React + SWR)                    │
│  ┌────────────┬────────────┬──────────┬────────────┐   │
│  │ ScreenHome │ ScreenReplay│ScreenAI │ Other...  │   │
│  └────────────┴────────────┴──────────┴────────────┘   │
│                          ↓                              │
│  App Router (pages: /, /replay, /indicators, etc.)       │
└─────────────────────────────────────────────────────────┘
                           ↓
                     HTTP/JSON API
                           ↓
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Backend (FastAPI on Port 8000)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ API Layer (v1/risk-score, v1/indicators, etc.)  │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Scoring Engine & Normalizer (Percentile math)    │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data Fetchers (FRED, yfinance, DBnomics, etc.)   │  │
│  │ + File Cache Layer (JSON with TTL)                │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  SQLite Database + Lifespan Bootstrap / Cron Sync       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
BubbleIndex/
├── backend/
│   ├── app/
│   │   ├── api/v1/                # Endpoint routing (risk_score, history, indicators, crisis)
│   │   ├── core/                  # Cache engine, custom exceptions, rate limiter
│   │   ├── data/
│   │   │   ├── fetchers/          # API loaders (FRED, yfinance, Finnhub, DBnomics, Multpl, Shiller)
│   │   │   └── loaders/           # Data synchronization and historical bootstrappers
│   │   ├── db/                    # SQLAlchemy engine, sessions, and database models
│   │   ├── schemas/               # Pydantic models for API request/response
│   │   ├── scoring/               # Scoring engine, weights, percentile logic, and crisis math
│   │   └── config.py              # Pydantic Settings
│   ├── run.py                     # Backend launch entrypoint
│   └── requirements.txt           # Backend package requirements
├── frontend/
│   ├── app/                       # Next.js pages (layout, page, about, ai, historical, etc.)
│   ├── components/                # Reusable UI elements (Screens, Gauges, Topbar, AppShell)
│   ├── lib/                       # API wrapper, localization (en/he), TypeScript types, utilities
│   └── package.json               # Node.js dependencies
└── README.md                      # Main developer guide
```

---

## Risk Methodology

The composite Risk Score (0–100) is calculated as a weighted average of five category scores. Each category relies on specific indicators normalized using **percentile-of-score** against 20 years of historical data:

$$\text{Normalized Score} = \text{PercentileofScore}(\text{Historical Array}, \text{Current Value})$$

### Scoring Weights

| Category | Weight | Indicators | Description |
|---|---|---|---|
| **Valuation** | 30% | Buffett Indicator (60%), S&P500 P/E (40%) | Equity market valuations relative to GDP and earnings |
| **Macro Stress** | 20% | Yield Curve Spread (40%), Fed Funds (35%), Unemployment (25%) | Economic health, yield inversions, and monetary tightness |
| **Leverage/Credit** | 20% | VIX Level (50%), High-Yield Spread (50%) | Credit market pricing, risk spreads, and option volatility |
| **Sentiment** | 15% | VIX 30-day Momentum (100%) | Short-term volatility acceleration and panic levels |
| **Concentration** | 15% | Top 10 S&P500 Market Cap Share (100%) | Market breadth and index concentration risk |

---

## API Endpoints

### 1. Risk Score
- `GET /api/v1/risk-score/current` — Dynamically computes and returns today's composite risk score, categories, and crisis comparisons.
- `GET /api/v1/risk-score/latest` — Fetches the latest computed risk snapshot stored in the database.
- `POST /api/v1/risk-score/refresh` — Clears the cache and forces a fresh calculation of current scores.

### 2. Indicators
- `GET /api/v1/indicators/current` — Returns the current raw and normalized values for all indicators.
- `GET /api/v1/indicators/{indicator_name}/history` — Returns historical series for a specific indicator (e.g., `vix_level`, `shiller_cape`).
  - **Query Params:** `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD).

### 3. History
- `GET /api/v1/history/snapshots` — Fetches list of historical snapshots containing composite and category scores.
- `GET /api/v1/history/snapshots/{snapshot_date}` — Fetches a snapshot summary for a specific date.
- `POST /api/v1/history/recompute` — Seeds concentration data and triggers a force-recompute of all historical database snapshots.

### 4. Crisis
- `GET /api/v1/crisis/similarity` — Cosine similarity of the current environment compared to historical crises.
- `GET /api/v1/crisis/profiles` — Meta-information on mapped historical crises (e.g., Dot-com, Great Financial Crisis, 1929 Crash).

---

## Configuration

### Backend Environment Variables (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```bash
# === Required API Keys ===
FRED_API_KEY=your_fred_api_key_here
FINNHUB_API_KEY=your_finnhub_api_key_here

# === Database & Cache ===
DATABASE_URL=sqlite:///./data/bubble_index.db
CACHE_DIR=./data/cache

# === App Settings ===
DEBUG=false
DAILY_SYNC_HOUR_UTC=18

# === CORS Configuration ===
CORS_ORIGINS=["http://localhost:3000","https://bubbleindex.us.kg"]
```

### Frontend Environment Variables (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-DX54Y767ZX  # Google Analytics ID
NEXT_PUBLIC_SITE_URL=https://bubbleindex.us.kg
```

---

## Development

### Running Tests
To run unit and integration tests:
```bash
cd backend
pytest
```

### Troubleshooting

#### 1. Bootstrap fails / incomplete data
If you encounter missing series or database inconsistencies, clear the flag to re-run the bootstrapper:
```bash
# Delete the flag file
rm backend/data/cache/bootstrap_done.flag

# Restart the backend
python run.py
```

#### 2. Vercel / CORS Issues
If the frontend cannot communicate with the API, ensure `CORS_ORIGINS` in your backend `.env` contains your exact frontend domain name (e.g. `https://bubbleindex.us.kg`).
