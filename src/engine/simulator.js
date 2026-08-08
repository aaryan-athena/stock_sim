import { factorDefinitions } from "../data/externalFactors";

// ── Score pillars ──────────────────────────────────────────────────────────
// The fundamental score is the sum of five pillars, each capped at its own
// maximum. `live` lets the simulator swap in the PE/PEG implied by the
// simulated price instead of the static screener values.
export function computeScorePillars(f, live = {}) {
  const pe = live.pe ?? f.pe;
  const peg = live.peg ?? f.peg3Y;
  const anchorPE = live.anchorPE ?? f.pe;

  // Revenue growth (0-20 pts)
  const growth = Math.min(20, Math.max(0, f.salesYoY * 100));

  // Profitability (0-25 pts) — weighted OPM + NPM
  const profitability = Math.min(25, f.opm * 50 + f.npm * 80);

  // Cash flow (0-20 pts)
  const cashFlow = Math.min(20, f.cfoMargin * 60 + (f.cfoToNP > 1 ? 5 : 0));

  // Balance sheet (0-15 pts) — low debt is good
  const balanceSheet = Math.max(0, 15 - f.debtToEquity * 15);

  // Valuation (0-20 pts) — PEG (12 pts) + PE relative to its anchor (8 pts).
  // A price that runs ahead of earnings lifts PE above the anchor and bleeds
  // points here, which is what closes the feedback loop in the simulation.
  const pegPoints = peg > 0 ? clamp(12 - peg * 2.4, 0, 12) : 6;
  const richness = anchorPE > 0 ? pe / anchorPE : 1;
  const pePoints = clamp(8 * (1.5 - richness), 0, 8);
  const valuation = pegPoints + pePoints;

  return [
    {
      key: "growth",
      label: "Revenue Growth",
      points: growth,
      max: 20,
      color: "#3B82F6",
      detail: `Sales YoY ${(f.salesYoY * 100).toFixed(1)}%`,
    },
    {
      key: "profitability",
      label: "Profitability",
      points: profitability,
      max: 25,
      color: "#10B981",
      detail: `OPM ${(f.opm * 100).toFixed(1)}% · NPM ${(f.npm * 100).toFixed(1)}%`,
    },
    {
      key: "cashFlow",
      label: "Cash Flow",
      points: cashFlow,
      max: 20,
      color: "#8B5CF6",
      detail: `CFO margin ${(f.cfoMargin * 100).toFixed(1)}% · CFO/NP ${f.cfoToNP.toFixed(2)}`,
    },
    {
      key: "balanceSheet",
      label: "Balance Sheet",
      points: balanceSheet,
      max: 15,
      color: "#F59E0B",
      detail: `Debt/Equity ${f.debtToEquity.toFixed(2)}`,
    },
    {
      key: "valuation",
      label: "Valuation",
      points: valuation,
      max: 20,
      color: "#EC4899",
      detail: `P/E ${pe.toFixed(1)} vs anchor ${anchorPE.toFixed(1)} · PEG ${peg > 0 ? peg.toFixed(2) : "n/a"}`,
    },
  ];
}

// Compute a fundamental score from a stock's parameters (0 to 1 scale)
function computeFundamentalScore(f, live = {}) {
  const total = computeScorePillars(f, live).reduce((sum, p) => sum + p.points, 0);
  return total / 100; // normalize to 0-1
}

// Compute external factor impact for a stock (-1 to +1 range)
function computeExternalImpact(stock, factors) {
  let impact = 0;
  const defs = Object.fromEntries(factorDefinitions.map((d) => [d.id, d]));

  for (const [factorId, sensitivity] of Object.entries(stock.sectorSensitivity)) {
    const def = defs[factorId];
    if (!def) continue;
    const value = factors[factorId] ?? def.default;
    // Normalize factor value to -1..+1 range
    const mid = (def.max + def.min) / 2;
    const range = (def.max - def.min) / 2;
    const normalized = (value - mid) / range; // -1 to +1
    impact += normalized * sensitivity;
  }

  // Normalize by number of factors
  const numFactors = Object.keys(stock.sectorSensitivity).length;
  return impact / numFactors;
}

// ── Valuation state ────────────────────────────────────────────────────────
// Every stock carries an EPS that compounds each quarter and a PE/PEG that are
// re-derived from the simulated price. Seeded from the static fundamentals.
export function initValuationState(stock) {
  const f = stock.fundamentals;
  const eps = f.epsINR > 0 ? f.epsINR : stock.basePrice / Math.max(f.pe, 1);
  return {
    eps,
    pe: f.pe,
    peg: f.peg3Y,
    anchorPE: f.pe,
    growthAnnual: f.salesYoY,
  };
}

// Advance EPS one quarter and re-derive PE/PEG off the new price.
function stepValuation(state, price, externalImpact) {
  // Macro conditions tilt realized earnings growth around the trend rate.
  const growthAnnual = state.growthAnnual + externalImpact * 0.04;
  const growthQuarterly = Math.pow(1 + Math.max(growthAnnual, -0.5), 0.25) - 1;
  const eps = Math.max(state.eps * (1 + growthQuarterly), 0.01);

  const pe = price / eps;
  const growthPct = growthAnnual * 100;
  const peg = growthPct > 0.5 ? pe / growthPct : 0;

  return { ...state, eps, pe, peg, growthAnnual };
}

// Simulate one quarter of price movement
export function simulateQuarter(stock, factors, currentPrice, randomSeed, state) {
  const valuation = state ?? initValuationState(stock);
  const fundScore = computeFundamentalScore(stock.fundamentals, valuation);
  const externalImpact = computeExternalImpact(stock, factors);

  // Fundamental drift: strong fundamentals push price up (quarterly)
  const fundamentalDrift = (fundScore - 0.5) * 0.08;

  // External impact scales the quarterly return
  const externalDrift = externalImpact * 0.12;

  // Valuation feedback: a price that has outrun earnings pulls back toward the
  // anchor multiple, and a de-rated one gets a tailwind.
  const richness = Math.log(valuation.pe / valuation.anchorPE);
  const valuationDrift = -0.06 * clamp(richness, -0.6, 0.6);

  // Random market noise (using seeded randomness for reproducibility)
  const noise = (seededRandom(randomSeed) - 0.5) * 0.1;

  // Combined quarterly return
  const quarterlyReturn =
    fundamentalDrift + externalDrift + valuationDrift + noise + (state?.macroShock ?? 0);

  // Clamp to prevent extreme moves
  const clampedReturn = Math.max(-0.25, Math.min(0.3, quarterlyReturn));

  const newPrice = Math.max(currentPrice * (1 + clampedReturn), 1);
  const nextValuation = stepValuation(valuation, newPrice, externalImpact);

  return {
    price: Math.round(newPrice * 100) / 100,
    quarterlyReturn: clampedReturn,
    valuation: nextValuation,
    fundScore,
    breakdown: {
      fundamental: fundamentalDrift,
      external: externalDrift,
      valuation: valuationDrift,
      noise,
    },
  };
}

// ── Factor paths ───────────────────────────────────────────────────────────
// The engine always runs against a per-quarter array of factor objects. A plain
// factor object (from the sliders) is held constant across every quarter.
export function normalizeFactorPath(factors, quarters) {
  if (Array.isArray(factors)) {
    if (factors.length === 0) return Array.from({ length: quarters }, () => ({}));
    return Array.from({ length: quarters }, (_, i) => factors[Math.min(i, factors.length - 1)]);
  }
  return Array.from({ length: quarters }, () => factors);
}

function quarterLabel(q) {
  return `Q${((q - 1) % 4) + 1} FY${2026 + Math.floor((q - 1) / 4)}`;
}

const MACRO_SHOCK_SPREAD = 0.05;

// Run one full path for one stock. `runIndex` of null is the deterministic run;
// a number draws a per-run macro shock that persists across the whole path.
//
// The shock is drawn by stratified sampling — run r takes a jittered draw from
// the r-th slice of the range — so 100 runs cover the macro spread evenly
// instead of leaving the median at the mercy of an unlucky sample.
function simulatePath(stock, factorPath, quarters, runIndex, salt, totalRuns = 1) {
  const macroShock =
    runIndex === null
      ? 0
      : ((runIndex + seededRandom(hashCode(`${stock.id}-macro-${runIndex}-${salt}`))) /
          totalRuns -
          0.5) *
        MACRO_SHOCK_SPREAD;

  const start = initValuationState(stock);
  const priceHistory = [
    {
      quarter: 0,
      price: stock.basePrice,
      label: "Start",
      pe: start.pe,
      peg: start.peg,
      eps: start.eps,
    },
  ];

  let price = stock.basePrice;
  let valuation = { ...start, macroShock };

  for (let q = 1; q <= quarters; q++) {
    const factors = factorPath[q - 1];
    const seed = hashCode(
      `${stock.id}-${q}-${runIndex ?? "det"}-${salt}-${JSON.stringify(factors)}`
    );
    const result = simulateQuarter(stock, factors, price, seed, valuation);
    price = result.price;
    valuation = { ...result.valuation, macroShock };

    priceHistory.push({
      quarter: q,
      price: result.price,
      return: result.quarterlyReturn,
      breakdown: result.breakdown,
      pe: result.valuation.pe,
      peg: result.valuation.peg,
      eps: result.valuation.eps,
      fundScore: result.fundScore,
      label: quarterLabel(q),
    });
  }

  return { priceHistory, finalPrice: price, valuation };
}

function summarize(stock, path, quarters) {
  const finalReturn = ((path.finalPrice - stock.basePrice) / stock.basePrice) * 100;
  return {
    stock,
    priceHistory: path.priceHistory,
    finalPrice: path.finalPrice,
    finalValuation: path.valuation,
    totalReturn: Math.round(finalReturn * 100) / 100,
    cagr:
      Math.round(
        (Math.pow(path.finalPrice / stock.basePrice, 1 / (quarters / 4)) - 1) * 100 * 100
      ) / 100,
  };
}

// Run a full simulation of N quarters
export function runSimulation(stocks, factors, quarters = 12, options = {}) {
  const factorPath = normalizeFactorPath(factors, quarters);
  const salt = options.salt ?? "";
  const results = {};

  for (const stock of stocks) {
    results[stock.id] = summarize(
      stock,
      simulatePath(stock, factorPath, quarters, null, salt),
      quarters
    );
  }

  return results;
}

// ── Monte Carlo ────────────────────────────────────────────────────────────
// N seeded runs per stock, collapsed into a median path plus percentile bands.
export function runMonteCarlo(stocks, factors, quarters = 12, options = {}) {
  const runs = options.runs ?? 100;
  const lowerPct = options.lowerPct ?? 10;
  const upperPct = options.upperPct ?? 90;
  const factorPath = normalizeFactorPath(factors, quarters);
  const salt = options.salt ?? "";

  const results = {};

  for (const stock of stocks) {
    const paths = [];
    for (let r = 0; r < runs; r++) {
      paths.push(simulatePath(stock, factorPath, quarters, r, salt, runs));
    }

    // Percentile bands, quarter by quarter, across all runs.
    const bands = [];
    for (let q = 0; q <= quarters; q++) {
      const prices = paths.map((p) => p.priceHistory[q].price).sort((a, b) => a - b);
      const lo = percentile(prices, lowerPct);
      const hi = percentile(prices, upperPct);
      bands.push({
        quarter: q,
        label: q === 0 ? "Start" : quarterLabel(q),
        median: round2(percentile(prices, 50)),
        p25: round2(percentile(prices, 25)),
        p75: round2(percentile(prices, 75)),
        lower: round2(lo),
        upper: round2(hi),
        band: [round2(lo), round2(hi)],
      });
    }

    const finals = paths.map((p) => p.finalPrice).sort((a, b) => a - b);
    const medianFinal = percentile(finals, 50);
    const toReturn = (price) =>
      Math.round(((price - stock.basePrice) / stock.basePrice) * 100 * 100) / 100;

    // The median run is what the summary cards / portfolio read from, so pick
    // the actual path closest to the median outcome rather than an average.
    const medianPath = paths.reduce((best, p) =>
      Math.abs(p.finalPrice - medianFinal) < Math.abs(best.finalPrice - medianFinal) ? p : best
    );

    results[stock.id] = {
      ...summarize(stock, medianPath, quarters),
      monteCarlo: {
        runs,
        lowerPct,
        upperPct,
        bands,
        finalPrice: {
          median: round2(medianFinal),
          lower: round2(percentile(finals, lowerPct)),
          upper: round2(percentile(finals, upperPct)),
        },
        finalReturn: {
          median: toReturn(medianFinal),
          lower: toReturn(percentile(finals, lowerPct)),
          upper: toReturn(percentile(finals, upperPct)),
        },
        probPositive:
          Math.round((finals.filter((p) => p > stock.basePrice).length / runs) * 1000) / 10,
      },
    };
  }

  return results;
}

// Linear-interpolated percentile over a pre-sorted ascending array
function percentile(sorted, pct) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (pct / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Seeded pseudo-random number generator (mulberry32 finaliser).
//
// Seeds here are string hashes that differ by only a bit or two between
// adjacent quarters and runs, so the generator has to avalanche — a single
// Lehmer step leaves neighbouring seeds producing near-identical draws, which
// silently collapses a 100-run Monte Carlo into a handful of distinct paths.
function seededRandom(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Hash a string to a number for seed generation
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

export { computeFundamentalScore, computeExternalImpact };
