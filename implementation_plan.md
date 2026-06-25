# Solar BESS Profitability Advisor — Implementation Plan

## Overview

A production-ready full-stack web app for Indian renewable energy consultants to evaluate whether adding BESS to a solar project improves profitability. Built with **FastAPI + React + Plotly**, structured for maintainability and future PostgreSQL/auth upgrades.

---

## Architecture Decision

**Chosen Stack: FastAPI + React + Plotly + Tailwind CSS**

Rationale: The business logic (NPV, IRR, sensitivity analysis, DSM calculations) is non-trivial and benefits from a proper Python backend. React gives a professional dashboard feel. Streamlit was considered but rejected since the UX requirements (side-by-side comparisons, charts, export, advisory note) warrant a real frontend.

---

## Project Structure

```
solar-bess-advisor/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── routers/
│   │   ├── analysis.py            # POST /analyze
│   │   ├── advisory.py            # POST /advisory-note
│   │   └── health.py              # GET /health
│   ├── models/
│   │   ├── inputs.py              # Pydantic input models
│   │   └── outputs.py             # Pydantic output models
│   ├── core/
│   │   ├── financial.py           # NPV, IRR, payback calculations
│   │   ├── revenue.py             # Revenue stream calculations
│   │   ├── cashflow.py            # Year-by-year cash flow builder
│   │   └── sensitivity.py         # Sensitivity/tornado analysis
│   ├── utils/
│   │   ├── validators.py          # Business-rule validation
│   │   └── advisory.py            # Advisory note generator
│   ├── tests/
│   │   ├── test_financial.py      # Unit tests: NPV, IRR, payback
│   │   └── test_revenue.py        # Unit tests: revenue calculations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── api/
│   │   │   └── client.js          # API fetch hooks
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.jsx
│   │   │   │   └── RecommendationBadge.jsx
│   │   │   ├── inputs/
│   │   │   │   ├── SolarInputs.jsx
│   │   │   │   ├── BESSInputs.jsx
│   │   │   │   └── RevenueInputs.jsx
│   │   │   ├── results/
│   │   │   │   ├── ComparisonTable.jsx
│   │   │   │   └── AdvisoryNote.jsx
│   │   │   ├── charts/
│   │   │   │   ├── CashFlowChart.jsx
│   │   │   │   ├── RevenueStackChart.jsx
│   │   │   │   ├── NPVComparisonChart.jsx
│   │   │   │   └── SensitivityChart.jsx
│   │   │   └── exports/
│   │   │       └── ExportButtons.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inputs.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── Charts.jsx
│   │   │   └── Exports.jsx
│   │   ├── store/
│   │   │   └── useAppStore.js     # Zustand global state
│   │   └── utils/
│   │       └── formatters.js      # INR formatting, %, etc.
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── README.md
└── sample_data/
    └── default_scenario.json
```

---

## Business Logic

### Revenue Streams

| Stream | Formula |
|---|---|
| Base PPA Revenue | Generation × PPA Tariff |
| DSM Penalty Saved | DSM% × Base Revenue |
| Clipping Recovery | Clipping% × Generation × Uplift Tariff |
| Curtailment Recovery | Curtailment% × Generation × PPA Tariff |
| Energy Arbitrage | BESS Capacity × Cycles/day × 365 × (Sell Tariff - Buy Tariff) × RTE |
| Peak-Hour Uplift | Dispatched Energy × (Peak Tariff - PPA Tariff) |
| Ancillary Services | Optional: Capacity × Ancillary Rate |

### Financial Calculations

- **NPV**: Discounted cash flows over project life using WACC
- **IRR**: Solved via scipy (numpy_financial)
- **Simple Payback**: Incremental investment ÷ incremental annual gain
- **Solar degradation**: Applied per year on generation
- **Battery degradation**: Applied per year on BESS output
- **Battery replacement**: Optional year and cost
- **O&M**: Annual cost escalation

### Validation Warnings

- CUF > 35% → "Unusually high, verify"
- IRR < 6% → "Below typical WACC, unattractive"
- Battery cost < ₹2 Cr/MWh → "Suspiciously low capex"
- Payback > 15 years → "Exceeds typical project life"

---

## API Endpoints

### `POST /analyze`
**Input**: Full ProjectInputs model  
**Output**: AnalysisResult with solar-only + hybrid comparison, cash flows, sensitivity data

### `POST /advisory-note`
**Input**: AnalysisResult  
**Output**: Formatted advisory text (Markdown)

### `GET /health`
**Output**: `{"status": "ok"}`

---

## Default Scenario (Pre-filled)

```json
{
  "solar_capacity_mw": 500,
  "cuf_percent": 22,
  "ppa_tariff_inr": 2.5,
  "clipping_loss_percent": 2.0,
  "dsm_penalty_percent": 1.5,
  "project_life_years": 25,
  "solar_degradation_percent": 0.5,
  "wacc_percent": 10,
  "bess_capacity_mwh": 250,
  "bess_power_mw": 100,
  "bess_capex_cr": 150,
  "bess_om_cr_year": 1.5,
  "rte_percent": 88,
  "battery_degradation_percent": 2,
  "cycles_per_day": 1,
  "peak_tariff_inr": 3.3,
  "ancillary_enabled": false
}
```

---

## Pages

### 1. Dashboard
- KPI cards: Solar NPV, Hybrid NPV, NPV Gain, IRRs, Payback
- Recommendation badge (Attractive / Marginal / Not Attractive)
- Quick summary of top revenue drivers

### 2. Inputs
- Three grouped form sections with validation
- Smart defaults loaded on mount
- Field-level error messages

### 3. Results
- Side-by-side comparison table
- Revenue stream breakdown
- Warnings panel
- Advisory note

### 4. Charts
- Cash flow comparison (bar+line)
- Revenue stack (stacked bar)
- NPV comparison
- Sensitivity tornado chart

### 5. Exports
- Download JSON
- Download CSV
- Print advisory card

---

## Verification Plan

### Automated Tests
```bash
cd backend && python -m pytest tests/ -v
```
Tests cover: NPV, IRR, payback, all revenue streams, edge cases (zero BESS, zero clipping)

### Manual Verification
- Load default scenario → check KPIs match expected values
- Change battery capex → verify sensitivity chart updates
- Export CSV → verify correct columns and values
- Advisory note → verify recommendation matches IRR band

---

## Setup Summary

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend  
cd frontend && npm install && npm run dev
```

