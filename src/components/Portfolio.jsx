import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

const INITIAL_CASH = 1000000;

export default function Portfolio({ stocks, results }) {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState({});
  const [cash, setCash] = useState(INITIAL_CASH);
  const [tradeQty, setTradeQty] = useState({});
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Load portfolio from Firestore on mount ────────────────────────────────
  useEffect(() => {
    if (!user || !db) {
      setPortfolioLoading(false);
      return;
    }
    async function load() {
      try {
        const snap = await getDoc(doc(db, "portfolios", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setCash(data.cash ?? INITIAL_CASH);
          setHoldings(data.holdings ?? {});
        }
      } catch (e) {
        console.error("Failed to load portfolio:", e.message);
      } finally {
        setPortfolioLoading(false);
      }
    }
    load();
  }, [user]);

  // ── Persist to Firestore ──────────────────────────────────────────────────
  const persist = useCallback(
    async (newCash, newHoldings) => {
      if (!user || !db) return;
      setSaving(true);
      try {
        await setDoc(doc(db, "portfolios", user.uid), {
          cash: newCash,
          holdings: newHoldings,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Portfolio save failed:", e.message);
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getPrice = (stockId) => {
    if (results?.[stockId]) return results[stockId].finalPrice;
    return stocks.find((s) => s.id === stockId)?.basePrice ?? 0;
  };

  // ── Buy ───────────────────────────────────────────────────────────────────
  const buy = async (stockId) => {
    const qty = parseInt(tradeQty[stockId]) || 0;
    if (qty <= 0) return;
    const price = getPrice(stockId);
    const cost = price * qty;
    if (cost > cash) {
      showToast("Insufficient cash for this trade", "error");
      return;
    }
    const prev = holdings[stockId];
    const newHoldings = {
      ...holdings,
      [stockId]: {
        qty: (prev?.qty || 0) + qty,
        avgPrice:
          ((prev?.avgPrice || 0) * (prev?.qty || 0) + cost) /
          ((prev?.qty || 0) + qty),
      },
    };
    const newCash = cash - cost;
    setCash(newCash);
    setHoldings(newHoldings);
    setTradeQty((prev) => ({ ...prev, [stockId]: "" }));
    showToast(`Bought ${qty} × ${stocks.find((s) => s.id === stockId)?.name}`);
    await persist(newCash, newHoldings);
  };

  // ── Sell ──────────────────────────────────────────────────────────────────
  const sell = async (stockId) => {
    const qty = parseInt(tradeQty[stockId]) || 0;
    if (qty <= 0 || !holdings[stockId] || qty > holdings[stockId].qty) {
      showToast("Invalid sell quantity", "error");
      return;
    }
    const price = getPrice(stockId);
    const proceeds = price * qty;
    const newQty = holdings[stockId].qty - qty;
    let newHoldings;
    if (newQty === 0) {
      const { [stockId]: _, ...rest } = holdings;
      newHoldings = rest;
    } else {
      newHoldings = { ...holdings, [stockId]: { ...holdings[stockId], qty: newQty } };
    }
    const newCash = cash + proceeds;
    setCash(newCash);
    setHoldings(newHoldings);
    setTradeQty((prev) => ({ ...prev, [stockId]: "" }));
    showToast(`Sold ${qty} × ${stocks.find((s) => s.id === stockId)?.name}`);
    await persist(newCash, newHoldings);
  };

  // ── Reset portfolio ───────────────────────────────────────────────────────
  const reset = async () => {
    setCash(INITIAL_CASH);
    setHoldings({});
    setTradeQty({});
    showToast("Portfolio reset to ₹10L");
    await persist(INITIAL_CASH, {});
  };

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalInvested = Object.entries(holdings).reduce(
    (sum, [, h]) => sum + h.avgPrice * h.qty,
    0
  );
  const totalCurrent = Object.entries(holdings).reduce(
    (sum, [id, h]) => sum + getPrice(id) * h.qty,
    0
  );
  const totalPnL = totalCurrent - totalInvested;
  const portfolioValue = cash + totalCurrent;
  const totalReturn = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (portfolioLoading) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 flex items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="text-gray-400 text-sm">Loading your portfolio…</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 relative">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`absolute top-3 right-3 px-3 py-2 rounded-lg text-xs font-medium z-10 ${
              toast.type === "error"
                ? "bg-red-900/80 text-red-300 border border-red-700"
                : "bg-green-900/80 text-green-300 border border-green-700"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">Portfolio</h3>
          {saving && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full"
            />
          )}
          {db && !saving && (
            <span className="text-[10px] text-green-500 font-mono">● synced</span>
          )}
        </div>
        <button
          onClick={reset}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryCard label="Portfolio Value" value={`₹${portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
        <SummaryCard label="Cash Available" value={`₹${cash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} color="text-green-400" />
        <SummaryCard label="Invested" value={`₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} color="text-blue-400" />
        <SummaryCard
          label="Unrealized P&L"
          value={`${totalPnL >= 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub={totalInvested > 0 ? `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(1)}%` : null}
          color={totalPnL >= 0 ? "text-green-400" : "text-red-400"}
        />
      </div>

      {/* Trade panel */}
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
        Trade Stocks
      </p>
      <div className="space-y-2">
        {stocks.map((stock) => {
          const h = holdings[stock.id];
          const price = getPrice(stock.id);
          const qty = parseInt(tradeQty[stock.id]) || 0;
          const canBuy = qty > 0 && price * qty <= cash;
          const canSell = qty > 0 && h && qty <= h.qty;
          return (
            <div
              key={stock.id}
              className="flex items-center gap-2 bg-gray-900/30 rounded-lg p-2"
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                style={{ backgroundColor: stock.color }}
              >
                {stock.id.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 font-medium truncate">
                  {stock.name}
                  {h && <span className="text-gray-500 ml-1">({h.qty})</span>}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={tradeQty[stock.id] || ""}
                onChange={(e) =>
                  setTradeQty((prev) => ({ ...prev, [stock.id]: e.target.value }))
                }
                className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white text-center focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => buy(stock.id)}
                disabled={!canBuy}
                className="px-2.5 py-1 bg-green-700 hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded font-medium transition-colors"
              >
                Buy
              </button>
              <button
                onClick={() => sell(stock.id)}
                disabled={!canSell}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded font-medium transition-colors"
              >
                Sell
              </button>
            </div>
          );
        })}
      </div>

      {/* Holdings table */}
      {Object.keys(holdings).length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
            Holdings
          </p>
          {Object.entries(holdings).map(([id, h]) => {
            const stock = stocks.find((s) => s.id === id);
            const currentPrice = getPrice(id);
            const pnl = (currentPrice - h.avgPrice) * h.qty;
            const pnlPct = ((currentPrice - h.avgPrice) / h.avgPrice) * 100;
            return (
              <motion.div
                key={id}
                layout
                className="flex justify-between items-center py-1.5 text-xs border-b border-gray-700/30"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stock?.color }} />
                  <span className="text-gray-300">{stock?.name}</span>
                </div>
                <span className="text-gray-400 font-mono">
                  {h.qty} × ₹{h.avgPrice.toFixed(0)}
                </span>
                <span className={`font-mono font-semibold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {pnl >= 0 ? "+" : ""}₹{Math.abs(pnl).toFixed(0)}{" "}
                  <span className="text-[10px]">({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className={`font-mono font-bold text-base ${color}`}>{value}</p>
      {sub && <p className={`text-[10px] font-mono ${color} opacity-70`}>{sub}</p>}
    </div>
  );
}
