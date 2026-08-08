import { useState } from "react";
import { motion } from "framer-motion";
import { computeScorePillars } from "../engine/simulator";

// Popover showing the five pillars that make up a stock's fundamental score.
// When a simulation has run, it can also show the pillars recomputed against
// the PE/PEG implied by the final simulated price.
export default function ScoreBreakdown({ stock, result, onClose }) {
  const hasProjection = !!result?.finalValuation;
  const [view, setView] = useState("today");

  const live =
    hasProjection && view === "projected"
      ? {
          pe: result.finalValuation.pe,
          peg: result.finalValuation.peg,
          anchorPE: result.finalValuation.anchorPE,
        }
      : {};

  const pillars = computeScorePillars(stock.fundamentals, live);
  const total = pillars.reduce((sum, p) => sum + p.points, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute left-0 right-0 top-full mt-2 z-20 bg-gray-900 border border-gray-600 rounded-xl p-3 shadow-2xl shadow-black/50"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-white font-semibold">Score Breakdown</p>
          <p className="text-[10px] text-gray-500">{stock.name} — 5 pillars, 100 pts</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-200 text-sm leading-none px-1"
          aria-label="Close score breakdown"
        >
          ✕
        </button>
      </div>

      {hasProjection && (
        <div className="flex gap-1 mb-2.5">
          {[
            { id: "today", label: "Today" },
            { id: "projected", label: "At Q12 price" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-1 text-[10px] py-1 rounded-md border transition-colors ${
                view === v.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {pillars.map((p) => (
          <div key={p.key}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-300">{p.label}</span>
              <span className="font-mono text-gray-400">
                {p.points.toFixed(1)}
                <span className="text-gray-600">/{p.max}</span>
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(p.points / p.max) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ backgroundColor: p.color }}
              />
            </div>
            <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{p.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 pt-2 border-t border-gray-700 flex justify-between text-[10px]">
        <span className="text-gray-400">Total</span>
        <span className="font-mono font-semibold text-white">{total.toFixed(1)}/100</span>
      </div>

      {view === "projected" && (
        <p className="text-[9px] text-gray-500 mt-1.5 leading-tight">
          Valuation is recomputed each quarter from the simulated price — a stock that
          outruns its earnings re-rates upward and loses points here.
        </p>
      )}
    </motion.div>
  );
}
