# Solar BESS Profitability Advisor — Walkthrough

We have fully verified the codebase. Below is a summary of the verification results and steps on how to launch the application.

---

## 1. Verified Achievements

### Backend Logic & Unit Tests
We verified the core financial engine and revenue calculation routines by running the pytest suite. All **19 tests** passed successfully:
- **Unit Conversions:** Tariff conversion formulas.
- **Solar-Only Calculations:** Base PPA revenues, DSM penalty functions.
- **Hybrid-BESS Revenue Streams:** Peak shift calculations, Grid arbitrage models (with negative margin handling), Clipping/Curtailment recovery with efficiency losses, and Ancillary service revenues.
- **Financial Projections:** NPV calculations, IRR bisection search, and LCOE for both modes.

Run the tests at any time using:
```bash
cd solar-bess-advisor/backend
.venv\Scripts\python.exe -m pytest tests/ -v
```

### Frontend Compilation & Build
- Checked and resolved **TypeScript errors** in [AnalysisCharts.tsx](file:///c:/Users/dell/Documents/Solar%20BESS%20Adviser/solar-bess-advisor/frontend/src/components/charts/AnalysisCharts.tsx) relating to unknown types in the inputs summary and Plotly axis configurations.
- Ran `npx tsc --noEmit` which completed successfully with **0 errors**.
- Ran `npx vite build` which successfully created the production build (`dist/`) in `46.03s`.

---

## 2. Running the Application Locally

You can launch the full-stack app locally using the following steps:

### A. Run the Backend (FastAPI)
1. Navigate to the backend directory:
   ```powershell
   cd solar-bess-advisor/backend
   ```
2. Start the FastAPI development server:
   ```powershell
   .venv\Scripts\uvicorn main:app --reload --port 8000
   ```
   *The backend documentation is accessible at `http://localhost:8000/docs`.*

### B. Run the Frontend (Vite + React)
1. Open a new terminal window and navigate to the frontend directory:
   ```powershell
   cd solar-bess-advisor/frontend
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *The frontend dashboard will be available at `http://localhost:5173`.*

---

## 3. Manual Verification Steps

To manually test the advisor:
1. Open `http://localhost:5173`.
2. Fill out the three-step input configuration wizard (Solar Params → BESS Params → Revenue Stack). The defaults for a 500 MW solar plant are pre-loaded.
3. Click **Run Analysis** to navigate to the Results screen.
4. Verify the **Recommendation Banner** (e.g., Attractive, Marginal, Not Attractive) and key KPI cards (NPVs, IRRs, simple payback, and levelized costs).
5. Switch between the results views:
   - **Dashboard:** Side-by-side comparison tables and charts.
   - **Cash Flows:** Scrollable year-by-year cash flows.
   - **Sensitivity:** The Tornado diagram showing how NPV changes under ±20% parameter shifts.
   - **Advisory:** AI-generated narrative advisory note (falls back to rule-based markdown if no `GOOGLE_API_KEY` is present in the environment).
6. Click **Export Excel** or **Export PDF** in the Advisory panel to test file generation and downloading.
