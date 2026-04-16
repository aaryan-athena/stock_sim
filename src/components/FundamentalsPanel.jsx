export default function FundamentalsPanel({ stock }) {
  if (!stock) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-white font-semibold mb-2">Stock Fundamentals</h3>
        <p className="text-gray-500 text-sm">Select a stock to view detailed fundamentals</p>
      </div>
    );
  }

  const f = stock.fundamentals;

  const sections = [
    {
      title: "Revenue Growth",
      metrics: [
        { label: "Sales (Cr)", value: `₹${f.salesCr.toLocaleString("en-IN")}` },
        { label: "Sales YoY Growth", value: `${(f.salesYoY * 100).toFixed(1)}%`, good: f.salesYoY > 0.08 },
      ],
    },
    {
      title: "Profitability",
      metrics: [
        { label: "Operating Profit Margin", value: `${(f.opm * 100).toFixed(1)}%`, good: f.opm > 0.2 },
        { label: "Net Profit Margin", value: `${(f.npm * 100).toFixed(1)}%`, good: f.npm > 0.12 },
      ],
    },
    {
      title: "Cash Flow Strength",
      metrics: [
        { label: "CFO (Cr)", value: `₹${f.cfoCr.toLocaleString("en-IN")}` },
        { label: "CFO Margin", value: `${(f.cfoMargin * 100).toFixed(1)}%`, good: f.cfoMargin > 0.15 },
        { label: "CFO / Net Profit", value: f.cfoToNP.toFixed(2), good: f.cfoToNP > 1 },
      ],
    },
    {
      title: "Balance Sheet Risk",
      metrics: [
        { label: "Net Cash (Cr)", value: `₹${f.netCashCr.toLocaleString("en-IN")}`, good: f.netCashCr > 0 },
        { label: "Debt to Equity", value: f.debtToEquity.toFixed(2), good: f.debtToEquity < 0.5 },
      ],
    },
    {
      title: "Valuation vs Growth",
      metrics: [
        { label: "P/E Ratio", value: f.pe.toFixed(1), good: f.pe < 30 },
        { label: "EPS (INR)", value: `₹${f.epsINR.toFixed(2)}` },
        { label: "PEG (3Y)", value: f.peg3Y.toFixed(2), good: f.peg3Y < 2 },
      ],
    },
  ];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: stock.color }}
        >
          {stock.id.slice(0, 2)}
        </div>
        <h3 className="text-white font-semibold">{stock.name} — Fundamentals</h3>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
              {section.title}
            </p>
            <div className="space-y-1.5">
              {section.metrics.map((m) => (
                <div key={m.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{m.label}</span>
                  <span
                    className={`text-sm font-mono font-semibold ${
                      m.good === undefined
                        ? "text-gray-200"
                        : m.good
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Historical trend */}
      <div className="mt-5 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
          10-Year Trend (FY16–FY25)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-1 font-medium">FY</th>
                <th className="text-right py-1 font-medium">Sales YoY</th>
                <th className="text-right py-1 font-medium">OPM</th>
                <th className="text-right py-1 font-medium">NPM</th>
                <th className="text-right py-1 font-medium">P/E</th>
              </tr>
            </thead>
            <tbody>
              {stock.history.map((h) => (
                <tr key={h.fy} className="text-gray-300 border-t border-gray-700/30">
                  <td className="py-1">{h.fy}</td>
                  <td className={`text-right font-mono ${h.salesYoY > 0 ? "text-green-400" : h.salesYoY < 0 ? "text-red-400" : "text-gray-500"}`}>
                    {h.salesYoY ? `${(h.salesYoY * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="text-right font-mono">{(h.opm * 100).toFixed(1)}%</td>
                  <td className="text-right font-mono">{(h.npm * 100).toFixed(1)}%</td>
                  <td className="text-right font-mono">{h.pe.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
