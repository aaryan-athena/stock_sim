import { useState } from "react";

const INITIAL_CASH = 1000000; // 10 Lakh starting capital

export default function Portfolio({ stocks, results }) {
  const [holdings, setHoldings] = useState({});
  const [cash, setCash] = useState(INITIAL_CASH);
  const [tradeQty, setTradeQty] = useState({});

  const getPrice = (stockId) => {
    if (results && results[stockId]) return results[stockId].finalPrice;
    const stock = stocks.find((s) => s.id === stockId);
    return stock ? stock.basePrice : 0;
  };

  const buy = (stockId) => {
    const qty = parseInt(tradeQty[stockId]) || 0;
    if (qty <= 0) return;
    const price = getPrice(stockId);
    const cost = price * qty;
    if (cost > cash) return;
    setCash((prev) => prev - cost);
    setHoldings((prev) => ({
      ...prev,
      [stockId]: {
        qty: (prev[stockId]?.qty || 0) + qty,
        avgPrice:
          ((prev[stockId]?.avgPrice || 0) * (prev[stockId]?.qty || 0) + cost) /
          ((prev[stockId]?.qty || 0) + qty),
      },
    }));
    setTradeQty((prev) => ({ ...prev, [stockId]: "" }));
  };

  const sell = (stockId) => {
    const qty = parseInt(tradeQty[stockId]) || 0;
    if (qty <= 0 || !holdings[stockId] || qty > holdings[stockId].qty) return;
    const price = getPrice(stockId);
    setCash((prev) => prev + price * qty);
    setHoldings((prev) => {
      const newQty = prev[stockId].qty - qty;
      if (newQty === 0) {
        const { [stockId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [stockId]: { ...prev[stockId], qty: newQty } };
    });
    setTradeQty((prev) => ({ ...prev, [stockId]: "" }));
  };

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

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <h3 className="text-white font-semibold mb-4">Portfolio Manager</h3>

      {/* Portfolio summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Portfolio Value</p>
          <p className="text-white font-mono font-bold text-lg">
            ₹{portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Cash Available</p>
          <p className="text-green-400 font-mono font-bold text-lg">
            ₹{cash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Invested</p>
          <p className="text-blue-400 font-mono font-semibold">
            ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase">Unrealized P&L</p>
          <p
            className={`font-mono font-semibold ${
              totalPnL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Trade panel */}
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
        Trade Stocks
      </p>
      <div className="space-y-2">
        {stocks.map((stock) => {
          const h = holdings[stock.id];
          const price = getPrice(stock.id);
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
                  {h && (
                    <span className="text-gray-500 ml-1">
                      ({h.qty} shares)
                    </span>
                  )}
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
                  setTradeQty((prev) => ({
                    ...prev,
                    [stock.id]: e.target.value,
                  }))
                }
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white text-center focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => buy(stock.id)}
                className="px-2.5 py-1 bg-green-700 hover:bg-green-600 text-white text-xs rounded font-medium transition-colors"
              >
                Buy
              </button>
              <button
                onClick={() => sell(stock.id)}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded font-medium transition-colors"
              >
                Sell
              </button>
            </div>
          );
        })}
      </div>

      {/* Holdings */}
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
              <div
                key={id}
                className="flex justify-between items-center py-1.5 text-xs border-b border-gray-700/30"
              >
                <span className="text-gray-300">{stock?.name}</span>
                <span className="text-gray-400 font-mono">
                  {h.qty} x ₹{h.avgPrice.toFixed(0)}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(0)} ({pnlPct.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
