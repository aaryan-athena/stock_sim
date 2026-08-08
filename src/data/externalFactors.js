// External factors that impact the Indian stock market
// Each factor has a current value, range, and impact description

export const factorDefinitions = [
  {
    id: "rbiRate",
    name: "RBI Repo Rate",
    unit: "%",
    min: 4.0,
    max: 8.5,
    default: 6.5,
    step: 0.25,
    description: "Reserve Bank of India's key lending rate. Higher rates tighten liquidity and pressure equities, especially rate-sensitive sectors like banking and real estate.",
    impact: "Higher rate → Banks benefit from wider NIMs but loan growth slows. IT & Pharma less affected. Consumer staples see demand pressure.",
  },
  {
    id: "gdpGrowth",
    name: "GDP Growth Rate",
    unit: "%",
    min: 2.0,
    max: 10.0,
    default: 6.8,
    step: 0.5,
    description: "India's annual GDP growth rate. Strong growth boosts corporate earnings across sectors. Slowdowns hit cyclical sectors hardest.",
    impact: "Higher GDP → broad market rally. Energy & Banking benefit most. Consumer Staples are defensive and less correlated.",
  },
  {
    id: "globalSentiment",
    name: "Global Market Sentiment",
    unit: "score",
    min: -5,
    max: 5,
    default: 1,
    step: 1,
    description: "Overall global risk appetite. Positive = risk-on (emerging markets rally). Negative = risk-off (capital flight to safe havens). Driven by US Fed policy, geopolitics, and global trade.",
    impact: "Positive sentiment → FII inflows, IT exports benefit from global spending. Negative → capital outflows, rupee weakens.",
  },
  {
    id: "fiiFlows",
    name: "FII/FPI Flows",
    unit: "₹K Cr",
    min: -50,
    max: 50,
    default: 5,
    step: 5,
    description: "Foreign Institutional Investor net flows into Indian equities. FIIs own ~17% of NSE market cap. Large outflows create significant selling pressure.",
    impact: "Strong inflows → large-cap rally (especially IT, Banking). Outflows → broad market decline, rupee depreciation.",
  },
  {
    id: "monsoon",
    name: "Monsoon Quality",
    unit: "score",
    min: -3,
    max: 3,
    default: 1,
    step: 1,
    description: "Quality of the Indian monsoon season. Agriculture employs ~42% of workforce. Good monsoon → rural demand boost, lower food inflation. Bad monsoon → food inflation, RBI forced to hold rates.",
    impact: "Good monsoon → FMCG/Consumer Staples rally, rural banking growth. Bad monsoon → food inflation, rate hike fears.",
  },
  {
    id: "govtPolicy",
    name: "Government Policy Stance",
    unit: "score",
    min: -3,
    max: 3,
    default: 1,
    step: 1,
    description: "Government economic policy direction. Includes budget announcements, PLI schemes, disinvestment, tax reforms, and regulatory changes.",
    impact: "Pro-business reforms → broad rally. Higher taxes/regulation → sector-specific impact. PLI schemes directly boost targeted sectors.",
  },
  {
    id: "rupeeDollar",
    name: "USD/INR Movement",
    unit: "₹",
    min: 78,
    max: 92,
    default: 84,
    step: 0.5,
    description: "Rupee vs Dollar exchange rate. Weaker rupee benefits IT exporters (revenue in USD) but hurts import-dependent companies (Energy, Pharma raw materials).",
    impact: "Rupee weakness → IT gains, Energy costs rise. Rupee strength → reverse effect. Crude oil imports become key variable.",
  },
];

// Pre-built scenarios, written as scripted quarterly factor paths.
//
// Each scenario is a sequence of keyframes pinned to a quarter. The engine runs
// against a value for every quarter, so `buildFactorPath` linearly interpolates
// between consecutive keyframes — a macro story that develops over 3 years
// rather than a single frozen set of slider positions.
export const scenarios = [
  {
    id: "bull",
    name: "Bull Run",
    emoji: "📈",
    description: "Liquidity-led rally that builds, peaks, then cools as rates normalise",
    keyframes: [
      {
        quarter: 1,
        note: "Recovery takes hold — RBI starts easing, foreign money returns",
        factors: { rbiRate: 6.25, gdpGrowth: 7.0, globalSentiment: 2, fiiFlows: 15, monsoon: 2, govtPolicy: 2, rupeeDollar: 84 },
      },
      {
        quarter: 6,
        note: "Peak euphoria — record FII inflows, strong monsoon, easy money",
        factors: { rbiRate: 5.5, gdpGrowth: 8.5, globalSentiment: 4, fiiFlows: 45, monsoon: 3, govtPolicy: 3, rupeeDollar: 82 },
      },
      {
        quarter: 12,
        note: "Rally matures — RBI normalises rates, inflows moderate",
        factors: { rbiRate: 6.25, gdpGrowth: 7.5, globalSentiment: 3, fiiFlows: 20, monsoon: 2, govtPolicy: 2, rupeeDollar: 83 },
      },
    ],
  },
  {
    id: "bear",
    name: "Bear Market",
    emoji: "📉",
    description: "Global recession hits, capital flees, then a slow policy-led repair",
    keyframes: [
      {
        quarter: 1,
        note: "Cracks appear — global growth scare, FIIs start trimming",
        factors: { rbiRate: 6.75, gdpGrowth: 6.0, globalSentiment: -1, fiiFlows: -10, monsoon: 1, govtPolicy: 0, rupeeDollar: 85 },
      },
      {
        quarter: 5,
        note: "Capitulation — heavy outflows, rupee at record lows, tight policy",
        factors: { rbiRate: 7.75, gdpGrowth: 4.0, globalSentiment: -5, fiiFlows: -45, monsoon: -1, govtPolicy: -2, rupeeDollar: 91 },
      },
      {
        quarter: 9,
        note: "Bottoming — sentiment stops worsening, RBI pivots to support growth",
        factors: { rbiRate: 6.75, gdpGrowth: 4.8, globalSentiment: -2, fiiFlows: -15, monsoon: 0, govtPolicy: 1, rupeeDollar: 89 },
      },
      {
        quarter: 12,
        note: "Repair — growth stabilises, cautious inflows resume",
        factors: { rbiRate: 6.0, gdpGrowth: 6.0, globalSentiment: 0, fiiFlows: 5, monsoon: 1, govtPolicy: 2, rupeeDollar: 87 },
      },
    ],
  },
  {
    id: "itBoom",
    name: "IT Export Boom",
    emoji: "💻",
    description: "Global tech capex supercycle with a steadily depreciating rupee",
    keyframes: [
      {
        quarter: 1,
        note: "Deal pipeline builds — early signs of a global tech upcycle",
        factors: { rbiRate: 6.5, gdpGrowth: 6.8, globalSentiment: 1, fiiFlows: 5, monsoon: 1, govtPolicy: 1, rupeeDollar: 85 },
      },
      {
        quarter: 7,
        note: "Full boom — record order books, rupee slides, exporters re-rate",
        factors: { rbiRate: 6.0, gdpGrowth: 7.5, globalSentiment: 4, fiiFlows: 25, monsoon: 1, govtPolicy: 2, rupeeDollar: 89 },
      },
      {
        quarter: 12,
        note: "Growth normalises — spending plateaus, rupee stays weak",
        factors: { rbiRate: 6.0, gdpGrowth: 7.0, globalSentiment: 2, fiiFlows: 12, monsoon: 1, govtPolicy: 1, rupeeDollar: 90 },
      },
    ],
  },
  {
    id: "monsoonCrisis",
    name: "Monsoon Failure",
    emoji: "🌧️",
    description: "Drought → food inflation → rate hikes → rural demand collapse, then recovery",
    keyframes: [
      {
        quarter: 1,
        note: "Normal conditions ahead of the season",
        factors: { rbiRate: 6.5, gdpGrowth: 6.8, globalSentiment: 1, fiiFlows: 5, monsoon: 1, govtPolicy: 1, rupeeDollar: 84 },
      },
      {
        quarter: 3,
        note: "Monsoon fails — deficit rainfall across the key sowing belt",
        factors: { rbiRate: 6.75, gdpGrowth: 6.0, globalSentiment: 0, fiiFlows: -5, monsoon: -3, govtPolicy: 0, rupeeDollar: 86 },
      },
      {
        quarter: 6,
        note: "Food inflation spikes — RBI hikes, rural demand collapses",
        factors: { rbiRate: 7.5, gdpGrowth: 5.0, globalSentiment: -1, fiiFlows: -15, monsoon: -3, govtPolicy: 0, rupeeDollar: 87 },
      },
      {
        quarter: 10,
        note: "Good monsoon returns — reservoirs refill, food prices ease",
        factors: { rbiRate: 6.75, gdpGrowth: 6.2, globalSentiment: 1, fiiFlows: 5, monsoon: 2, govtPolicy: 1, rupeeDollar: 85 },
      },
      {
        quarter: 12,
        note: "Rural demand recovers — rate cuts resume",
        factors: { rbiRate: 6.25, gdpGrowth: 7.0, globalSentiment: 1, fiiFlows: 12, monsoon: 2, govtPolicy: 2, rupeeDollar: 84 },
      },
    ],
  },
  {
    id: "reform",
    name: "Policy Reform Wave",
    emoji: "🏛️",
    description: "Reform announcements, disruptive implementation, then a durable growth uplift",
    keyframes: [
      {
        quarter: 1,
        note: "Reform agenda announced — PLI expansion, tax simplification",
        factors: { rbiRate: 6.5, gdpGrowth: 6.8, globalSentiment: 1, fiiFlows: 10, monsoon: 1, govtPolicy: 3, rupeeDollar: 84 },
      },
      {
        quarter: 4,
        note: "Transition friction — implementation disrupts near-term growth",
        factors: { rbiRate: 6.5, gdpGrowth: 6.0, globalSentiment: 1, fiiFlows: 5, monsoon: 1, govtPolicy: 2, rupeeDollar: 85 },
      },
      {
        quarter: 8,
        note: "Reforms bite — capex cycle turns, FIIs re-rate India",
        factors: { rbiRate: 6.0, gdpGrowth: 7.5, globalSentiment: 3, fiiFlows: 30, monsoon: 1, govtPolicy: 3, rupeeDollar: 83 },
      },
      {
        quarter: 12,
        note: "Structurally higher growth becomes the new baseline",
        factors: { rbiRate: 5.75, gdpGrowth: 8.0, globalSentiment: 3, fiiFlows: 25, monsoon: 2, govtPolicy: 3, rupeeDollar: 82 },
      },
    ],
  },
  {
    id: "neutral",
    name: "Baseline",
    emoji: "⚖️",
    description: "Current conditions, held flat — the control case for comparison",
    keyframes: [
      {
        quarter: 1,
        note: "Current market conditions, carried through unchanged",
        factors: { rbiRate: 6.5, gdpGrowth: 6.8, globalSentiment: 1, fiiFlows: 5, monsoon: 1, govtPolicy: 1, rupeeDollar: 84 },
      },
      {
        quarter: 12,
        note: "No macro regime change over the horizon",
        factors: { rbiRate: 6.5, gdpGrowth: 6.8, globalSentiment: 1, fiiFlows: 5, monsoon: 1, govtPolicy: 1, rupeeDollar: 84 },
      },
    ],
  },
].map((s) => ({
  ...s,
  // Quarter-1 values, so the sliders have something to show on selection.
  factors: { ...s.keyframes[0].factors },
}));

// Round a factor value to its defined step so the sliders land on legal values.
function snapToStep(def, value) {
  if (!def) return value;
  const snapped = Math.round(value / def.step) * def.step;
  const clamped = Math.min(def.max, Math.max(def.min, snapped));
  return Math.round(clamped * 100) / 100;
}

// Expand a scenario's keyframes into one factor object per quarter.
export function buildFactorPath(scenario, quarters = 12) {
  if (!scenario?.keyframes?.length) return null;

  const frames = [...scenario.keyframes].sort((a, b) => a.quarter - b.quarter);
  const path = [];

  for (let q = 1; q <= quarters; q++) {
    // Find the keyframe pair bracketing this quarter.
    let prev = frames[0];
    let next = frames[frames.length - 1];
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].quarter <= q) prev = frames[i];
      if (frames[i].quarter >= q) {
        next = frames[i];
        break;
      }
    }

    const span = next.quarter - prev.quarter;
    const t = span === 0 ? 0 : (q - prev.quarter) / span;

    const factors = {};
    for (const def of factorDefinitions) {
      const a = prev.factors[def.id] ?? def.default;
      const b = next.factors[def.id] ?? def.default;
      factors[def.id] = snapToStep(def, a + (b - a) * t);
    }

    path.push(factors);
  }

  return path;
}

// The keyframe whose narrative note is in effect at a given quarter.
export function activeKeyframe(scenario, quarter) {
  if (!scenario?.keyframes?.length) return null;
  const frames = [...scenario.keyframes].sort((a, b) => a.quarter - b.quarter);
  return frames.reduce((acc, f) => (f.quarter <= quarter ? f : acc), frames[0]);
}
