import { factorDefinitions } from "../data/externalFactors";

// Compute a fundamental score from a stock's parameters (0 to 1 scale)
function computeFundamentalScore(f) {
  // Revenue growth score (0-20 pts)
  const revenueScore = Math.min(20, Math.max(0, f.salesYoY * 100));

  // Profitability score (0-25 pts) — weighted OPM + NPM
  const profitScore = Math.min(25, (f.opm * 50 + f.npm * 80));

  // Cash flow score (0-20 pts)
  const cfoScore = Math.min(20, f.cfoMargin * 60 + (f.cfoToNP > 1 ? 5 : 0));

  // Balance sheet score (0-15 pts) — low debt is good
  const balanceScore = Math.max(0, 15 - f.debtToEquity * 15);

  // Valuation score (0-20 pts) — lower PEG is better
  const pegScore = f.peg3Y > 0 ? Math.max(0, 20 - f.peg3Y * 4) : 10;

  const total = revenueScore + profitScore + cfoScore + balanceScore + pegScore;
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

// Simulate one quarter of price movement
export function simulateQuarter(stock, factors, currentPrice, randomSeed) {
  const fundScore = computeFundamentalScore(stock.fundamentals);
  const externalImpact = computeExternalImpact(stock, factors);

  // Fundamental drift: strong fundamentals push price up (quarterly)
  const fundamentalDrift = (fundScore - 0.5) * 0.08;

  // External impact scales the quarterly return
  const externalDrift = externalImpact * 0.12;

  // Random market noise (using seeded randomness for reproducibility)
  const noise = (seededRandom(randomSeed) - 0.5) * 0.10;

  // Combined quarterly return
  const quarterlyReturn = fundamentalDrift + externalDrift + noise;

  // Clamp to prevent extreme moves
  const clampedReturn = Math.max(-0.25, Math.min(0.30, quarterlyReturn));

  const newPrice = currentPrice * (1 + clampedReturn);

  return {
    price: Math.round(newPrice * 100) / 100,
    quarterlyReturn: clampedReturn,
    breakdown: {
      fundamental: fundamentalDrift,
      external: externalDrift,
      noise,
    },
  };
}

// Run a full simulation of N quarters
export function runSimulation(stocks, factors, quarters = 12) {
  const results = {};

  for (const stock of stocks) {
    const priceHistory = [{ quarter: 0, price: stock.basePrice, label: "Start" }];
    let price = stock.basePrice;

    for (let q = 1; q <= quarters; q++) {
      const seed = hashCode(`${stock.id}-${q}-${JSON.stringify(factors)}`);
      const result = simulateQuarter(stock, factors, price, seed);
      price = result.price;
      priceHistory.push({
        quarter: q,
        price: result.price,
        return: result.quarterlyReturn,
        breakdown: result.breakdown,
        label: `Q${((q - 1) % 4) + 1} FY${2026 + Math.floor((q - 1) / 4)}`,
      });
    }

    const finalReturn = ((price - stock.basePrice) / stock.basePrice) * 100;

    results[stock.id] = {
      stock,
      priceHistory,
      finalPrice: price,
      totalReturn: Math.round(finalReturn * 100) / 100,
      cagr: Math.round(((Math.pow(price / stock.basePrice, 1 / (quarters / 4)) - 1) * 100) * 100) / 100,
    };
  }

  return results;
}

// Seeded pseudo-random number generator
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
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
