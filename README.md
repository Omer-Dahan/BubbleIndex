# BubbleIndex

A systemic market risk visualization platform for the US stock market. **BubbleIndex** monitors 125 years of financial data to calculate a composite Risk Score (0–100), comparing current market conditions against historical crisis periods and tracking five key risk dimensions.

<div align="center">

**[Home](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Risk Methodology](#risk-methodology) • [API](#api-endpoints)**

</div>

---

## Features

### 📊 Six Interactive Screens

1. **Home Dashboard** — Live composite Risk Score with category breakdown and AI-powered summary
2. **Market Replay** — 125-year historical timeline with crisis markers (1929, 1973, 1987, 2000, 2008, 2020)
3. **Indicators Explorer** — 6×24-month heatmap of all risk indicators with trend analysis
4. **Crisis Similarity** — Real-time comparison against 5 historical crisis profiles
5. **AI Insights** — Radar chart analysis and narrative risk assessment
6. **Methodology & Legal** — Full documentation, data sources, and terms

### 🎯 Risk Scoring System

- **Weighted composite** across 5 categories: Valuation (30%), Macro Stress (20%), Leverage/Credit (20%), Sentiment (15%), Concentration (15%)
- **Percentile normalization** against 20 years of historical data using scipy
- **Historical crisis comparison** via cosine similarity
- **Smart fallback** system: fresh data → stale cache → neutral score

### 🎨 Design System

- **Charcoal dark theme** with temperature-based color scale (9 steps: stable → bubble)
- **3 density modes** (compact, comfortable, spacious) for responsive design
- **4 color palettes** (temperature, traffic, violet, monochrome)
- **Accessible typography** with OpenType features (lining numbers for scores)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Pandas, NumPy, SciPy |
| **Data Sources** | FRED API, yfinance, Finnhub |
| **Database** | SQLite (with PostgreSQL migration path) |
| **Cache** | File-based with TTL (no external dependencies) |
| **Deployment** | Docker-ready, environment-configured |

---

## Quick Start

### Prerequisites

- **Python 3.12+** (backend)
- **Node.js 18+** (frontend)
- **FRED API Key** (free from [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/))
- **Finnhub API Key** (free from [finnhub.io](https://finnhub.io))

### Installation

#### 1. Clone and setup environment

```bash
git clone https://github.com/yourusername/BubbleIndex.git
cd BubbleIndex
```

#### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
# FRED_API_KEY=your_key_here
# FINNHUB_API_KEY=your_key_here
```

#### 3. Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure backend URL
cat > .env.local << EOF
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

#### 4. Run the application

**Terminal 1 — Backend (port 8000)**
```bash
cd backend
python run.py
```

You'll see:
```
INFO app.data.loaders.historical_bootstrap: Stored SP500: 2513 rows
INFO app.main: BubbleIndex API ready
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 — Frontend (port 3000)**
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
│  Frontend (Next.js 14 + React + TypeScript)            │
│  ┌────────────┬────────────┬──────────┬────────────┐   │
│  │ ScreenHome │ ScreenReplay│ScreenAI │ Other...  │   │
│  └────────────┴────────────┴──────────┴────────────┘   │
│                          ↓                              │
│  Next.js App Router + SWR Data Fetching                │
└─────────────────────────────────────────────────────────┘
                           ↓
                     HTTP/JSON API
                           ↓
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Backend (FastAPI on port 8000)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ API Layer (v1/risk-score, v1/indicators, etc.)  │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Scoring Engine (ScoringEngine, Normalizer)      │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data Fetchers (FRED, yfinance, Finnhub)        │  │
│  │ + Cache Layer (File-based JSON, TTL-based)     │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  SQLite Database + Historical Bootstrap               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           ↓
            External APIs (FRED, yfinance, Finnhub)
```

### Backend Directory Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + lifespan
│   ├── config.py                  # Pydantic-settings
│   ├── api/v1/
│   │   ├── risk_score.py          # GET /risk-score endpoints
│   │   ├── indicators.py          # GET /indicators endpoints
│   │   ├── history.py             # GET /history endpoints
│   │   └── crisis.py              # GET /crisis endpoints
│   ├── core/
│   │   ├── cache.py               # FileCache implementation
│   │   └── exceptions.py          # Custom exceptions
│   ├── data/
│   │   ├── fetchers/              # Data source integrations
│   │   │   ├── base.py
│   │   │   ├── fred.py
│   │   │   ├── yfinance_fetcher.py
│   │   │   └── finnhub.py
│   │   ├── processors/            # Indicator computation
│   │   │   ├── indicators.py
│   │   │   └── normalizer.py
│   │   └── loaders/               # Bootstrap logic
│   │       └── historical_bootstrap.py
│   ├── db/
│   │   ├── session.py             # Database initialization
│   │   ├── base.py                # SQLAlchemy base
│   │   └── models/                # ORM models
│   │       ├── indicator_series.py
│   │       ├── risk_snapshot.py
│   │       └── crisis_profile.py
│   ├── scoring/
│   │   ├── engine.py              # Main scoring orchestrator
│   │   ├── weights.py             # Configuration & weights
│   │   ├── percentile.py          # Historical normalization
│   │   └── crisis_similarity.py   # Crisis comparison
│   └── schemas/                   # Pydantic response models
│       ├── risk_score.py
│       ├── indicator.py
│       ├── history.py
│       └── crisis.py
├── tests/
├── alembic/                       # Database migrations
├── requirements.txt
├── .env.example
└── run.py                         # Entry point
```

### Frontend Directory Structure

```
frontend/
├── app/
│   ├── page.tsx                   # Root page (6-screen dashboard)
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Design system
├── components/
│   ├── Screen*.tsx                # 6 screen components
│   ├── Gauge*.tsx                 # Gauge visualizations (4 styles)
│   ├── Topbar.tsx                 # Navigation
│   └── Primitives.tsx             # Reusable UI components
├── lib/
│   ├── api.ts                     # Typed API client
│   ├── types.ts                   # TypeScript interfaces
│   └── utils.ts                   # Color, tone, series generation
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## Risk Methodology

### Scoring Composition

The composite Risk Score (0–100) is a weighted average of five risk categories:

| Category | Weight | Indicators | Description |
|---|---|---|---|
| **Valuation** | 30% | Buffett Indicator (60%), S&P500 P/E (40%) | Equity valuations vs. historical norms |
| **Macro Stress** | 20% | Yield Curve (40%), Fed Funds (35%), Unemployment (25%) | Economic growth and monetary tightness |
| **Leverage/Credit** | 20% | VIX Level (50%), HY Spread (50%) | Systemic leverage and credit risk |
| **Sentiment** | 15% | VIX Trend (100%) | Market volatility momentum |
| **Concentration** | 15% | Top-10 Share (100%) | Market breadth and mega-cap dominance |

### Normalization

Each indicator is normalized using **percentile-of-score** against 20 years of historical data:

```
normalized_score = scipy.stats.percentileofscore(historical_array, current_value)
```

This converts raw values (e.g., VIX=18.5, P/E=22.3) to 0–100 percentiles representing historical context.

### Risk Labels

- **0–20:** Low
- **21–40:** Moderate
- **41–60:** Elevated
- **61–80:** High
- **81–100:** Extreme

### Historical Comparison

Current indicator vector is compared to 5 pre-calibrated crisis profiles using **cosine similarity**:

- **1929 Black Tuesday** — Extreme valuations, sentiment crash
- **2000 Dot-com Crash** — Tech concentration, valuation bubble
- **2007–2008 GFC** — Credit stress, leverage unwinding
- **2020 COVID Crash** — Sudden volatility spike, macro shock
- **2021 Rate Cycle** — Yield curve inversion, tightening risk

---

## API Endpoints

### Risk Score

```http
GET /api/v1/risk-score/current
```

Returns today's composite score (cached 1 hour).

```json
{
  "composite_score": 72,
  "risk_label": "High",
  "snapshot_date": "2026-05-12",
  "categories": [
    {"name": "Valuation", "score": 78, "weight": 0.30},
    {"name": "Macro Stress", "score": 65, "weight": 0.20},
    {"name": "Leverage/Credit", "score": 68, "weight": 0.20},
    {"name": "Sentiment", "score": 71, "weight": 0.15},
    {"name": "Concentration", "score": 84, "weight": 0.15}
  ],
  "crisis_similarity": [
    {"name": "2007 GFC", "similarity": 0.62},
    {"name": "2000 Dot-com", "similarity": 0.58}
  ]
}
```

### Indicators

```http
GET /api/v1/indicators/current
```

All raw and normalized indicator values.

```http
GET /api/v1/indicators/{name}/history?start_date=2024-01-01&end_date=2026-05-12
```

Time-series for a specific indicator (e.g., `vix_level`, `buffett_indicator`).

### History

```http
GET /api/v1/history/snapshots?start_date=2024-01-01&end_date=2026-05-12
```

Composite and category scores over time.

### Crisis

```http
GET /api/v1/crisis/similarity
```

Similarity scores against historical crisis profiles.

```http
GET /api/v1/crisis/profiles
```

Crisis profile metadata.

### Health

```http
GET /health
```

Liveness check. Returns `{"status": "ok"}`.

---

## Data Sources

### FRED API (Federal Reserve Economic Data)

- **Rate Limit:** 120 requests/minute
- **Cache TTL:** 6 hours
- **Series Used:**
  - SP500, VIXCLS (daily)
  - DGS2, DGS10 (2Y, 10Y yields)
  - UNRATE (unemployment)
  - GDP (quarterly)
  - FEDFUNDS (monthly)
  - BAMLH0A0HYM2 (HY spread)
  - WILL5000PR (Wilshire 5000)

### yfinance (Yahoo Finance)

- **Rate Limit:** No strict limit
- **Cache TTL:** 1 hour
- **Data:** SPY, QQQ daily OHLCV

### Finnhub API

- **Rate Limit:** 60 requests/minute (free tier)
- **Cache TTL:** 4 hours
- **Data:** Company metrics, earnings, estimates

---

## Configuration

### Backend Environment Variables

Create `.env` in the `backend/` directory:

```bash
# Database
DATABASE_URL=sqlite:///./data/bubble_index.db

# API Keys (get free keys from each service)
FRED_API_KEY=your_fred_key_here
FINNHUB_API_KEY=your_finnhub_key_here

# Cache settings
CACHE_DIR=./data/cache

# API timeouts (seconds)
FRED_TIMEOUT=30
FINNHUB_TIMEOUT=30

# Cache TTL (hours)
FRED_CACHE_TTL_HOURS=6
YFINANCE_CACHE_TTL_HOURS=1
FINNHUB_CACHE_TTL_HOURS=4

# Fetch settings
MAX_RETRIES=3
BACKOFF_FACTOR=2.0
```

### Frontend Environment Variables

Create `.env.local` in the `frontend/` directory:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Development

### Running Tests

```bash
cd backend
pytest tests/
```

### Database Migrations

```bash
cd backend
alembic upgrade head
```

### Formatting & Linting

```bash
cd backend
black .
flake8 .
mypy .
```

---

## Key Design Decisions

### Historical Bootstrap

On first startup, the application fetches 20 years (~2006–present) of all FRED series and stores them in SQLite. This is a prerequisite for percentile-based normalization and runs automatically via FastAPI's lifespan event.

### In-Memory Cache

The `PercentileNormalizer` loads all historical data into in-memory NumPy arrays (~400 KB) at startup for instant runtime normalization.

### Three-Tier Fallback

If an indicator cannot be fetched:
1. Serve **fresh cache** (within TTL)
2. Serve **stale cache** (beyond TTL, with warning)
3. Use **neutral score** (50.0), mark as imputed

This ensures the system remains operational even with partial API outages.

### File-Based Cache

Uses JSON files with TTL timestamps instead of Redis to minimize dependencies. Cache is automatically cleaned of expired entries on startup.

---

## Performance

- **Bootstrap:** ~30 seconds on first startup (20 years of data)
- **API Response:** <500ms for `/risk-score/current` (cached after 1st call)
- **Normalization:** <1ms per indicator
- **Page Load:** ~2 seconds (SSR + data fetch)

---

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Must be 3.12+

# Check dependencies
pip install -r requirements.txt

# Check API keys
cat .env  # Ensure FRED_API_KEY and FINNHUB_API_KEY are set
```

### Frontend can't reach backend

```bash
# Verify backend is running
curl http://localhost:8000/health

# Check .env.local
cat frontend/.env.local  # Should have NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Empty database after startup

```bash
# Check logs for bootstrap errors
# Ensure .env has valid API keys
# Delete data/bootstrap_done.flag to re-run bootstrap
rm backend/data/bootstrap_done.flag
python run.py
```

---

## Future Enhancements

- [ ] PostgreSQL support with migrations
- [ ] Real-time WebSocket updates
- [ ] Mobile app (React Native)
- [ ] Email alerts for risk threshold breaches
- [ ] ML-based crisis prediction
- [ ] Machine learning indicators (LSTM, ensemble models)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Docker Compose deployment

---

## License

MIT License — See [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Python:** Follow PEP 8 with Black formatter
- **TypeScript:** Strict mode enabled, no `any` types
- **Git:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Tests:** Aim for >80% coverage on new code

---

## Acknowledgments

- **FRED API** for comprehensive US economic data
- **yfinance** for simplified Yahoo Finance access
- **Finnhub** for company metrics and estimates
- Inspired by Buffett Indicator, Shiller CAPE ratio, and market timing research

---

**Made with ❤️ for quantitative market analysis**
