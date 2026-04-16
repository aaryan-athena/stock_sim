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
        <p className="text-gray-500 text-xs mb-4">Normalized to starting price = 0%</p>
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
              <th className="text-right py-2 font-medium">Fundamental</th>
              <th className="text-right py-2 font-medium">External</th>
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
                <td className="text-right font-mono text-blue-400">{(d.breakdown.fundamental * 100).toFixed(1)}%</td>
                <td className="text-right font-mono text-purple-400">{(d.breakdown.external * 100).toFixed(1)}%</td>
                <td className="text-right font-mono text-gray-500">{(d.breakdown.noise * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
