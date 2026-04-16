export default function SectorHeatmap({ stocks, results }) {
  if (!results) return null;

  const sorted = [...stocks].sort(
    (a, b) => results[b.id].totalReturn - results[a.id].totalReturn
  );

  const maxReturn = Math.max(...sorted.map((s) => Math.abs(results[s.id].totalReturn)));

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <h3 className="text-white font-semibold mb-3">Sector Performance Heatmap</h3>
      <div className="grid grid-cols-5 gap-2">
        {sorted.map((stock) => {
          const r = results[stock.id];
          const intensity = Math.min(1, Math.abs(r.totalReturn) / Math.max(maxReturn, 1));
          const isPositive = r.totalReturn >= 0;
          const bg = isPositive
            ? `rgba(16, 185, 129, ${0.15 + intensity * 0.55})`
            : `rgba(239, 68, 68, ${0.15 + intensity * 0.55})`;

          return (
            <div
              key={stock.id}
              className="rounded-lg p-3 text-center transition-all"
              style={{ backgroundColor: bg }}
            >
              <p className="text-white font-semibold text-sm">{stock.id}</p>
              <p className="text-gray-300 text-[10px]">{stock.sector}</p>
              <p
                className={`font-mono font-bold text-lg mt-1 ${
                  isPositive ? "text-green-300" : "text-red-300"
                }`}
              >
                {isPositive ? "+" : ""}{r.totalReturn}%
              </p>
              <p className="text-gray-400 text-[10px] font-mono">
                ₹{r.finalPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
