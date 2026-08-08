import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { computeFundamentalScore } from "../engine/simulator";
import ScoreBreakdown from "./ScoreBreakdown";

export default function StockCard({ stock, result, isSelected, onSelect }) {
  const fundScore = computeFundamentalScore(stock.fundamentals);
  const f = stock.fundamentals;
  const hasResult = !!result;
  const totalReturn = hasResult ? result.totalReturn : 0;
  const isPositive = totalReturn >= 0;
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const projected = result?.finalValuation;

  return (
    <div
      onClick={() => onSelect(stock.id)}
      className={`bg-gray-800 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? "border-blue-500 shadow-blue-900/20 shadow-lg"
          : "border-gray-700 hover:border-gray-600"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: stock.color }}
            >
              {stock.id.slice(0, 2)}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{stock.name}</h3>
              <p className="text-gray-400 text-[11px]">{stock.sector}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-mono font-semibold text-sm">
              {hasResult
                ? `₹${result.finalPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                : `₹${stock.basePrice.toLocaleString("en-IN")}`}
            </p>
            {hasResult && (
              <p
                className={`text-xs font-mono font-semibold ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {totalReturn}%
              </p>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <MetricBadge label="Revenue YoY" value={`${(f.salesYoY * 100).toFixed(1)}%`} good={f.salesYoY > 0.08} />
          <MetricBadge label="OPM" value={`${(f.opm * 100).toFixed(1)}%`} good={f.opm > 0.2} />
          <MetricBadge label="P/E" value={f.pe.toFixed(1)} good={f.pe < 30} />
        </div>

        {/* Fundamental score bar — click to see the pillar breakdown */}
        <div className="mt-3 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBreakdownOpen((o) => !o);
            }}
            className="w-full text-left group"
            title="Click for the five-pillar score breakdown"
          >
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span className="group-hover:text-gray-200 transition-colors">
                Fundamental Score
                <span className="ml-1 text-gray-600 group-hover:text-blue-400">ⓘ</span>
              </span>
              <span className="font-mono">{(fundScore * 100).toFixed(0)}/100</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden ring-offset-2 ring-offset-gray-800 group-hover:ring-1 group-hover:ring-gray-500 transition-all">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fundScore * 100}%`,
                  backgroundColor: fundScore > 0.6 ? "#10B981" : fundScore > 0.4 ? "#F59E0B" : "#EF4444",
                }}
              />
            </div>
          </button>

          <AnimatePresence>
            {breakdownOpen && (
              <ScoreBreakdown
                stock={stock}
                result={result}
                onClose={() => setBreakdownOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {hasResult && (
          <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
            <span>
              CAGR: <span className={`font-mono font-semibold ${result.cagr >= 0 ? "text-green-400" : "text-red-400"}`}>{result.cagr}%</span>
            </span>
            <span title="P/E implied by the final simulated price">
              P/E: <span className="font-mono text-gray-300">{(projected?.pe ?? f.pe).toFixed(1)}</span>
            </span>
            <span title="PEG recomputed from the simulated price">
              PEG: <span className="font-mono text-gray-300">
                {projected?.peg > 0 ? projected.peg.toFixed(1) : f.peg3Y.toFixed(1)}
              </span>
            </span>
          </div>
        )}

        {hasResult && result.monteCarlo && (
          <div className="mt-2 pt-2 border-t border-gray-700/60 flex justify-between text-[10px] text-gray-500">
            <span>
              P{result.monteCarlo.lowerPct}–P{result.monteCarlo.upperPct}:{" "}
              <span className="font-mono text-gray-300">
                {result.monteCarlo.finalReturn.lower}% … {result.monteCarlo.finalReturn.upper}%
              </span>
            </span>
            <span>
              Win:{" "}
              <span className="font-mono text-gray-300">{result.monteCarlo.probPositive}%</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBadge({ label, value, good }) {
  return (
    <div className="bg-gray-900/50 rounded-lg px-2 py-1.5">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-xs font-mono font-semibold ${good ? "text-green-400" : "text-yellow-400"}`}>
        {value}
      </p>
    </div>
  );
}
