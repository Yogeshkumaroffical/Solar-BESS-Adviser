# Solar BESS Profitability Advisor

A production-ready full-stack web application for Indian renewable energy consultants to evaluate whether adding **Battery Energy Storage Systems (BESS)** to a solar project improves profitability.

![Stack](https://img.shields.io/badge/Stack-FastAPI%20%2B%20React%20%2B%20Plotly-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Dual-scenario financial analysis**: Solar-only vs. Solar + BESS (hybrid)
- **7 revenue stream calculations**: Base PPA, DSM savings, clipping recovery, curtailment recovery, energy arbitrage, peak-hour uplift, ancillary services
- **Financial metrics**: NPV, IRR, simple payback, LCOE
- **Year-by-year cash flow projection** with solar degradation and battery fade
- **Sensitivity tornado analysis** (±20% on 6 key variables)
- **Recommendation engine**: Attractive / Marginal / Not Attractive
- **Advisory note generation** (rule-based, with optional Google Gemini AI)
- **Export**: Excel (styled .xlsx) and PDF reports
- **Professional dark-mode dashboard** with Plotly charts

---

## Tech Stack

| Layer     | Technology                         |
|-----------|-------------------------------------|
| Backend   | Python 3.10+, FastAPI, Pydantic v2 |
| Frontend  | React 18, TypeScript, Vite          |
| Charts    | Plotly.js via react-plotly.js        |
| State     | Zustand                             |
| Styling   | Vanilla CSS (dark glassmorphism)    |
| Export    | openpyxl (Excel), HTML-to-PDF       |

---

## Quick Start

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm

### 1. Backend

```bash
cd solar-bess-advisor/backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 2. Frontend

```bash
cd solar-bess-advisor/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Run Tests

```bash
cd solar-bess-advisor/backend
python -m pytest tests/ -v
```

---

## Default Scenario

The application comes pre-loaded with a realistic 500 MW solar + 250 MWh BESS scenario based on Indian market conditions:

| Parameter | Value |
|-----------|-------|
| Solar Capacity | 500 MW |
| CUF | 22% |
| PPA Tariff | ₹2.50/kWh |
| Solar CAPEX | ₹1,750 Cr |
| BESS Capacity | 250 MWh / 100 MW |
| BESS CAPEX | ₹150 Cr |
| Peak Sell Tariff | ₹3.30/kWh |
| Project Life | 25 years |
| WACC | 10% |

See [`sample_data/default_scenario.json`](sample_data/default_scenario.json) for the full input set.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Run full financial analysis |
| `POST` | `/api/advisory` | Generate advisory note |
| `POST` | `/api/export/excel` | Download Excel report |
| `POST` | `/api/export/pdf` | Download PDF report |
| `GET`  | `/health` | Health check |

---

## Optional: AI Advisory Notes

Set a Google API key for AI-powered advisory note generation:

```bash
set GOOGLE_API_KEY=your-gemini-api-key
```

Without the key, the system automatically falls back to a comprehensive rule-based advisory note.

---

## Project Structure

```
solar-bess-advisor/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── routers/                   # API route handlers
│   ├── models/                    # Pydantic input/output models
│   ├── core/                      # Revenue calculation engine
│   ├── services/                  # Financial engine, advisory, exports
│   ├── tests/                     # Unit tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main application component
│   │   ├── components/            # UI components (inputs, results, charts)
│   │   ├── store/                 # Zustand state management
│   │   ├── api/                   # API client
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils/                 # Formatting utilities
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── sample_data/
│   └── default_scenario.json
└── README.md
```

---

## License

MIT © 2024
