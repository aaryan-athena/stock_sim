import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

export default function StockChart({ results, selectedStock, stocks }) {
  if (!results) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">
          Adjust external factors and run the simulation to see price projections
        </p>
      </div>
    );
  }

  const selected = selectedStock ? results[selectedStock] : null;

  const isMonteCarlo = Object.values(results).some((r) => r.monteCarlo);

  // Multi-stock comparison view
  if (!selected) {
    const allData = [];
    const quarterCount = Object.values(results)[0]?.priceHistory.length || 0;
    for (let i = 0; i < quarterCount; i++) {
      const point = { quarter: i };
      for (const [id, r] of Object.entries(results)) {
        // Normalize to percentage change from base
        const basePrice = r.priceHistory[0].price;
        point[id] = (((r.priceHistory[i].price - basePrice) / basePrice) * 100).toFixed(2);
        point[`${id}_label`] = r.priceHistory[i].label;
      }
      point.label = Object.values(results)[0].priceHistory[i].label;
      allData.push(point);
    }

    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-white font-semibold mb-1">All Stocks — Relative Performance (%)</h3>
        <p className="text-gray-500 text-xs mb-4">
          Normalized to starting price = 0%
          {isMonteCarlo && " — median path of each stock's runs. Select a stock for its fan chart."}
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={allData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#F3F4F6" }}
              formatter={(value, name) => [`${value}%`, stocks.find((s) => s.id === name)?.name || name]}
            />
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
            {stocks.map((stock) => (
              <Line
                key={stock.id}
                type="monotone"
                dataKey={stock.id}
                stroke={stock.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Single stock — Monte Carlo fan chart
  if (selected.monteCarlo) {
    return <FanChart selected={selected} />;
  }

  // Single stock detailed view
  const data = selected.priceHistory;
  const stock = selected.stock;
  const isPositive = selected.totalReturn >= 0;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">
            {stock.name}
            <span className="text-gray-400 font-normal text-sm ml-2">({stock.id})</span>
          </h3>
          <p className="text-gray-500 text-xs">{stock.sector} — Price Projection</p>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-lg font-bold">
            ₹{selected.finalPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className={`text-sm font-mono font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{selected.totalReturn}% ({selected.cagr}% CAGR)
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stock.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={stock.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} interval={1} />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickFormatter={(v) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
            labelStyle={{ color: "#F3F4F6" }}
            formatter={(value) => [`₹${parseFloat(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, "Price"]}
          />
          <ReferenceLine y={stock.basePrice} stroke="#6B7280" strokeDasharray="3 3" label={{ value: "Base", fill: "#6B7280", fontSize: 10 }} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={stock.color}
            strokeWidth={2}
            fill={`url(#gradient-${stock.id})`}
            activeDot={{ r: 5, fill: stock.color }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Quarter breakdown table */}
      <div className="mt-4 max-h-48 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 font-medium">Quarter</th>
              <th className="text-right py-2 font-medium">Price</th>
              <th className="text-right py-2 font-medium">Return</th>
              <th className="text-right py-2 font-medium">P/E</th>
              <th className="text-right py-2 font-medium">Fundamental</th>
              <th className="text-right py-2 font-medium">External</th>
              <th className="text-right py-2 font-medium">Valuation</th>
              <th className="text-right py-2 font-medium">Noise</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((d, i) => (
              <tr key={i} className="border-b border-gray-700/50 text-gray-300">
                <td className="py-1.5">{d.label}</td>
                <td className="text-right font-mono">₹{d.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                <td className={`text-right font-mono ${d.return >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(d.return * 100).toFixed(1)}%
                </td>
                <td className="text-right font-mono text-gray-400">{d.pe.toFixed(1)}</td>
                <td className="text-right font-mono text-blue-400">{(d.breakdown.fundamental * 100).toFixed(1)}%</td>
                <td className="text-right font-mono text-purple-400">{(d.breakdown.external * 100).toFixed(1)}%</td>
                <td className={`text-right font-mono ${d.breakdown.valuation >= 0 ? "text-emerald-400" : "text-pink-400"}`}>
                  {(d.breakdown.valuation * 100).toFixed(1)}%
                </td>
                <td className="text-right font-mono text-gray-500">{(d.breakdown.noise * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Monte Carlo fan chart ──────────────────────────────────────────────────
// Percentile bands are drawn as stacked areas: an invisible base up to the
// lower percentile, then one band segment per percentile step above it.
function FanChart({ selected }) {
  const stock = selected.stock;
  const mc = selected.monteCarlo;

  const data = mc.bands.map((b) => ({
    label: b.label,
    base: b.lower,
    lowTail: b.p25 - b.lower,
    core: b.p75 - b.p25,
    highTail: b.upper - b.p75,
    median: b.median,
    lower: b.lower,
    p25: b.p25,
    p75: b.p75,
    upper: b.upper,
  }));

  const spread = mc.finalReturn.upper - mc.finalReturn.lower;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">
            {stock.name}
            <span className="text-gray-400 font-normal text-sm ml-2">({stock.id})</span>
          </h3>
          <p className="text-gray-500 text-xs">
            Monte Carlo — {mc.runs} seeded runs, P{mc.lowerPct}–P{mc.upperPct} bands
          </p>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-lg font-bold">
            ₹{mc.finalPrice.median.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            <span className="text-gray-500 text-xs font-normal ml-1">median</span>
          </p>
          <p
            className={`text-sm font-mono font-semibold ${
              mc.finalReturn.median >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {mc.finalReturn.median >= 0 ? "+" : ""}
            {mc.finalReturn.median}%
            <span className="text-gray-500 font-normal ml-1">
              ({mc.finalReturn.lower}% … {mc.finalReturn.upper}%)
            </span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} interval={1} />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickFormatter={(v) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<FanTooltip lowerPct={mc.lowerPct} upperPct={mc.upperPct} />}
            cursor={{ stroke: "#6B7280", strokeDasharray: "3 3" }}
          />
          <ReferenceLine
            y={stock.basePrice}
            stroke="#6B7280"
            strokeDasharray="3 3"
            label={{ value: "Base", fill: "#6B7280", fontSize: 10 }}
          />
          {/* Invisible pedestal so the bands float at the right level */}
          <Area dataKey="base" stackId="fan" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="lowTail" stackId="fan" stroke="none" fill={stock.color} fillOpacity={0.12} />
          <Area dataKey="core" stackId="fan" stroke="none" fill={stock.color} fillOpacity={0.28} />
          <Area dataKey="highTail" stackId="fan" stroke="none" fill={stock.color} fillOpacity={0.12} />
          <Line
            type="monotone"
            dataKey="median"
            stroke={stock.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: stock.color }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend + outcome summary */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 rounded" style={{ backgroundColor: stock.color }} />
          Median
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-2.5 rounded-sm"
            style={{ backgroundColor: stock.color, opacity: 0.28 }}
          />
          P25–P75
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-2.5 rounded-sm"
            style={{ backgroundColor: stock.color, opacity: 0.12 }}
          />
          P{mc.lowerPct}–P{mc.upperPct}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <StatTile label={`P${mc.lowerPct} outcome`} value={`${mc.finalReturn.lower}%`} tone="bad" />
        <StatTile label="Median outcome" value={`${mc.finalReturn.median}%`} tone={mc.finalReturn.median >= 0 ? "good" : "bad"} />
        <StatTile label={`P${mc.upperPct} outcome`} value={`${mc.finalReturn.upper}%`} tone="good" />
        <StatTile label="Chance of gain" value={`${mc.probPositive}%`} tone="neutral" />
      </div>
      <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
        Each run re-derives P/E and PEG from its own simulated price every quarter, so paths
        that run hot get valuation drag pulling them back — that is what keeps the fan from
        widening without bound. Outcome spread across the middle 80% of runs is {spread.toFixed(1)}
        &nbsp;percentage points.
      </p>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const color =
    tone === "good" ? "text-green-400" : tone === "bad" ? "text-red-400" : "text-blue-400";
  return (
    <div className="bg-gray-900/50 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-sm font-mono font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function FanTooltip({ active, payload, label, lowerPct, upperPct }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const fmt = (v) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-100 font-medium mb-1">{label}</p>
      {[
        [`P${upperPct}`, d.upper, "text-gray-400"],
        ["P75", d.p75, "text-gray-300"],
        ["Median", d.median, "text-white font-semibold"],
        ["P25", d.p25, "text-gray-300"],
        [`P${lowerPct}`, d.lower, "text-gray-400"],
      ].map(([name, value, cls]) => (
        <div key={name} className="flex justify-between gap-4">
          <span className="text-gray-500">{name}</span>
          <span className={`font-mono ${cls}`}>{fmt(value)}</span>
        </div>
      ))}
    </div>
  );
}
