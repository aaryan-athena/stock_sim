# StockSim India — Indian Stock Market Simulator

A web-based simulation platform for the Indian stock market (NSE/BSE). It combines real company fundamentals with adjustable macroeconomic factors to project stock prices across 5 major sectors over 12 quarters (3 years).

Built with **React 19**, **Vite**, **TailwindCSS v4**, **Firebase**, and **Framer Motion**.

---

## Live Features

| Feature | Description |
|---------|-------------|
| **Price Simulation** | Projects stock prices over 12 quarters using fundamental scores + macro factor sensitivity |
| **5 Sectors, 5 Stocks** | IT Services (INFY), Banking (HDFC), Pharma (SUNP), Energy (RELI), Consumer Staples (NEST) |
| **7 Macro Factors** | RBI rate, GDP growth, FII flows, USD/INR, monsoon, global sentiment, govt policy |
| **6 Scenario Presets** | Bull Run, Bear Market, IT Export Boom, Monsoon Failure, Policy Reform, Baseline |
| **Portfolio Manager** | Buy/sell stocks with ₹10L starting capital, track unrealized P&L |
| **Admin Panel** | Edit stock fundamentals and sensitivity weights, save to Firestore (admin-only) |
| **Firebase Auth** | Email/password sign in and sign up |
| **Animated Landing Page** | Hero, features, how-it-works, sectors, and CTA sections with scroll animations |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), then fill in your `.env` file at the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Email that gets admin access to the stock management panel
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

> **Note:** The app works fully without Firebase configured — it falls back to local stock data and disables auth. Simulation, charts, and portfolio all work offline.

Enable these Firebase services in your project:
- **Authentication** → Email/Password provider
- **Firestore Database** → Create in production or test mode

### 3. Run development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

---

## Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing page | Public |
| `/simulator` | Stock market simulator | Public |
| `/admin` | Stock management panel | Admin only |

---

## How the Simulation Works

### Step 1 — Fundamental Score
Each stock is scored 0–100 based on 5 parameter groups derived from the CSV data:

| Category | Parameters Used | Weight |
|----------|----------------|--------|
| Revenue Growth | `Sales_YoY` | 20 pts |
| Profitability | `OPM`, `NPM` | 25 pts |
| Cash Flow Strength | `CFO_margin`, `CFO_to_NP` | 20 pts |
| Balance Sheet Risk | `Debt_to_Equity` (inverted) | 15 pts |
| Valuation vs Growth | `PEG_3Y` | 20 pts |

### Step 2 — External Factor Impact
Each stock has 7 sector-specific sensitivity weights (−1.0 to +1.0). Each macro factor is normalized to a −1 to +1 scale and multiplied by its sensitivity weight to produce an `externalImpact` score.

Example — Infosys sensitivities:
```
globalSentiment: +0.9   (highly correlated with global tech demand)
rupeeDollar:    -0.7   (weaker rupee = more USD revenue)
rbiRate:        -0.3   (marginal negative effect)
monsoon:        +0.1   (near zero, not India-domestic dependent)
```

### Step 3 — Quarterly Price Movement
For each of the 12 quarters:

```
quarterlyReturn = fundamentalDrift + externalDrift + noise
```

- `fundamentalDrift` = (fundScore − 0.5) × 8% — strong fundamentals push price up
- `externalDrift` = externalImpact × 12% — macro environment accelerates or slows movement
- `noise` = seeded pseudo-random ± 5% — market noise (deterministic per run for reproducibility)
- Result is clamped to −25% / +30% per quarter to prevent extreme moves

---

## File Structure

```
stock_sim/
├── .env                          # Firebase credentials (never commit this)
├── index.html
├── vite.config.js
│
└── src/
    ├── main.jsx                  # App entry — wraps with BrowserRouter + AuthProvider
    ├── App.jsx                   # Route definitions (/, /simulator, /admin)
    ├── index.css                 # TailwindCSS import + custom scrollbar/range styles
    │
    ├── firebase/
    │   └── config.js             # Firebase init, exports auth + db, isFirebaseConfigured flag
    │
    ├── context/
    │   └── AuthContext.jsx       # Auth state, signIn, signUp, signOut, isAdmin
    │
    ├── hooks/
    │   └── useStocks.js          # Fetches stocks from Firestore, falls back to local data
    │
    ├── data/
    │   ├── stocks.js             # 5 stock objects with fundamentals, history, sensitivities
    │   └── externalFactors.js    # 7 factor definitions + 6 scenario presets
    │
    ├── engine/
    │   └── simulator.js          # runSimulation(), computeFundamentalScore(), seededRandom()
    │
    ├── pages/
    │   ├── Landing.jsx           # Animated landing page (Hero, Stats, Features, How It Works, Sectors, CTA)
    │   ├── Simulator.jsx         # Two-panel simulator (sidebar + results area)
    │   └── Admin.jsx             # Stock CRUD form, Firestore read/write, seed button
    │
    └── components/
        ├── Navbar.jsx            # Sticky nav with auth state, admin link, user dropdown
        ├── AuthModal.jsx         # Login/signup modal with Framer Motion animations
        ├── ExternalFactors.jsx   # Macro factor sliders + scenario preset buttons
        ├── StockCard.jsx         # Per-stock card with fundamental score bar + simulation result
        ├── StockChart.jsx        # Recharts area/line chart — single stock or multi-stock comparison
        ├── FundamentalsPanel.jsx # Detailed fundamentals table + 10-year historical trend
        ├── SectorHeatmap.jsx     # Color-coded sector performance grid
        └── Portfolio.jsx         # Buy/sell interface, holdings table, P&L summary
```

---

## Stock Data

All 5 stocks follow the same parameter schema derived from the CSV template (`INFY_10y_features`):

| Parameter | CSV Column | Description |
|-----------|------------|-------------|
| `salesCr` | `Sales_cr` | Annual revenue in crores |
| `salesYoY` | `Sales_YoY` | Year-on-year revenue growth |
| `opm` | `OPM` | Operating profit margin |
| `npm` | `NPM` | Net profit margin |
| `cfoCr` | `CFO_cr` | Cash from operations |
| `cfoMargin` | `CFO_margin` | CFO as % of revenue |
| `cfoToNP` | `CFO_to_NP` | CFO / Net Profit ratio (>1 = high quality earnings) |
| `netCashCr` | `NetCash_cr` | Net cash position |
| `debtToEquity` | `Debt_to_Equity` | D/E ratio |
| `pe` | `PE` | Price-to-earnings ratio |
| `epsINR` | `EPS_INR` | Earnings per share |
| `peg3Y` | `PEG_3Y` | PEG ratio over 3 years |

**Data accuracy:**
- **Infosys (INFY)** — All 10 years of fundamentals sourced directly from `INFY_10y_features 1(Key_Parameters).csv`
- **HDFC Bank, Sun Pharma, Reliance, Nestle** — Approximated from knowledge of historical financial performance. For production use, replace with actual screener data from Screener.in, Trendlyne, or BSE/NSE reports using the same CSV format

---

## Admin Panel

The admin panel at `/admin` is only accessible when signed in with the email set in `VITE_ADMIN_EMAIL`.

**What admins can do:**
1. **Edit** any stock's basic info (name, sector, base price, color)
2. **Update** all 12 fundamental parameters for the latest financial year
3. **Adjust** the 7 sector sensitivity weights that control how macro factors affect each stock
4. **Save** changes to Firestore — all simulator users will see the updated data
5. **Seed All** — push all 5 local default stocks to Firestore in one click (useful for initial setup)

---

## External Factors Reference

| Factor | Range | Positive → | Negative → |
|--------|-------|-----------|-----------|
| RBI Repo Rate | 4–8.5% | Banks (wider NIMs) | Growth stocks, real estate |
| GDP Growth | 2–10% | All cyclicals | Defensives outperform |
| Global Sentiment | −5 to +5 | IT, FII inflows | Capital outflows, rupee falls |
| FII/FPI Flows | −50 to +50K Cr | Large-cap rally | Broad market selloff |
| Monsoon Quality | −3 to +3 | FMCG, rural banking | Food inflation, rate fears |
| Govt Policy | −3 to +3 | Energy, reform beneficiaries | Regulated sectors |
| USD/INR | ₹78–92 | IT exporters | Energy importers, Pharma APIs |

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool with HMR |
| TailwindCSS | v4 | Utility-first styling |
| Framer Motion | 12 | Page transitions and scroll animations |
| Recharts | 2 | Stock price and comparison charts |
| Firebase | 11 | Authentication + Firestore database |
| React Router | 7 | Client-side routing |
