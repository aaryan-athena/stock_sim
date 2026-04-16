import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ExternalFactors from "../components/ExternalFactors";
import StockCard from "../components/StockCard";
import StockChart from "../components/StockChart";
import FundamentalsPanel from "../components/FundamentalsPanel";
import Portfolio from "../components/Portfolio";
import SectorHeatmap from "../components/SectorHeatmap";
import { useStocks } from "../hooks/useStocks";
import { scenarios } from "../data/externalFactors";
import { runSimulation } from "../engine/simulator";

function getSectorInsight(stock) {
  const insights = {
    "IT Services":
      "IT services companies earn primarily in USD, making them strong beneficiaries of rupee depreciation. They are relatively immune to domestic macro factors like monsoon and RBI rates, but highly sensitive to global tech spending and FII sentiment.",
    "Banking & Financials":
      "Banks benefit from higher interest rates (wider NIMs) but face asset quality risks during economic slowdowns. Strong GDP growth drives loan demand. FII flows significantly impact large-cap banking stocks.",
    "Pharma & Healthcare":
      "Pharma is a defensive sector with low cyclicality. Government policy (price controls, FDA approvals) is the biggest swing factor. Rupee weakness helps exporters but increases API import costs.",
    Energy:
      "Energy sector is heavily influenced by global crude prices and government policy (subsidy, pricing freedom). Reliance's diversification into telecom & retail reduces pure energy correlation.",
    "Consumer Staples":
      "Consumer staples are the most defensive sector. Monsoon quality directly impacts rural demand (60%+ of FMCG sales). Premium valuations reflect earnings stability and low balance-sheet risk.",
  };
  return insights[stock.sector] || "";
}

export default function Simulator() {
  const { stocks, loading } = useStocks();
  const [factors, setFactors] = useState({
    ...scenarios.find((s) => s.id === "neutral").factors,
  });
  const [results, setResults] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeTab, setActiveTab] = useState("chart");

  const handleSimulate = useCallback(() => {
    const simResults = runSimulation(stocks, factors, 12);
    setResults(simResults);
  }, [stocks, factors]);

  const handleSelectStock = (id) =>
    setSelectedStock((prev) => (prev === id ? null : id));

  const selectedStockData = stocks.find((s) => s.id === selectedStock);

  const sensitivityLabels = {
    globalSentiment: "Global Sentiment",
    rbiRate: "RBI Rate",
    gdpGrowth: "GDP Growth",
    fiiFlows: "FII Flows",
    monsoon: "Monsoon",
    govtPolicy: "Govt Policy",
    rupeeDollar: "USD/INR",
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-gray-400">Loading stock data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      <Navbar />

      <motion.div
        className="flex flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* LEFT SIDEBAR */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-r border-gray-800 overflow-hidden">
          {/* Run button — always visible */}
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSimulate}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/40 text-sm"
            >
              ▶ Run Simulation (12 Quarters)
            </motion.button>
            {results && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs text-green-400 mt-2"
              >
                Simulation complete — results updated
              </motion.p>
            )}
          </div>

          {/* Scrollable factor controls */}
          <div className="flex-1 overflow-y-auto p-4">
            <ExternalFactors factors={factors} setFactors={setFactors} />
          </div>
        </aside>

        {/* RIGHT MAIN */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Stock cards */}
            <motion.div
              className="grid grid-cols-5 gap-3"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {stocks.map((stock) => (
                <motion.div
                  key={stock.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                >
                  <StockCard
                    stock={stock}
                    result={results?.[stock.id]}
                    isSelected={selectedStock === stock.id}
                    onSelect={handleSelectStock}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Heatmap */}
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SectorHeatmap stocks={stocks} results={results} />
              </motion.div>
            )}

            {/* Chart + info row */}
            <div className="grid grid-cols-12 gap-5">
              {/* Center: tabs */}
              <div className="col-span-8">
                <div className="flex gap-1 mb-3">
                  {[
                    { id: "chart", label: "Price Chart" },
                    { id: "fundamentals", label: "Fundamentals" },
                    { id: "portfolio", label: "Portfolio" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        activeTab === tab.id
                          ? "text-white"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="tab-indicator"
                          className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "chart" && (
                    <StockChart results={results} selectedStock={selectedStock} stocks={stocks} />
                  )}
                  {activeTab === "fundamentals" && (
                    <FundamentalsPanel stock={selectedStockData} />
                  )}
                  {activeTab === "portfolio" && (
                    <Portfolio stocks={stocks} results={results} />
                  )}
                </motion.div>
              </div>

              {/* Right info panel */}
              <div className="col-span-4">
                {selectedStockData ? (
                  <motion.div
                    key={selectedStockData.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-gray-800 rounded-xl border border-gray-700 p-5"
                  >
                    <h3 className="text-white font-semibold mb-3">Sector Sensitivity</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      How {selectedStockData.name} reacts to each factor
                    </p>
                    <div className="space-y-3">
                      {Object.entries(selectedStockData.sectorSensitivity).map(([key, value]) => {
                        const isPositive = value > 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">{sensitivityLabels[key] || key}</span>
                              <span className={`font-mono font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {isPositive ? "+" : ""}{value.toFixed(1)}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.abs(value) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                style={{ backgroundColor: isPositive ? "#10B981" : "#EF4444" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 p-3 bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                        Sector Insight
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {getSectorInsight(selectedStockData)}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                    <h3 className="text-white font-semibold mb-3">Getting Started</h3>
                    <div className="space-y-3 text-sm text-gray-400">
                      {[
                        "Pick a scenario preset or adjust the factor sliders on the left",
                        "Click \"Run Simulation\" at the top-left to project prices over 3 years",
                        "Click any stock card to see detailed charts and sector sensitivity",
                        "Use the Portfolio tab to buy/sell stocks and track P&L",
                      ].map((step, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                      <p className="text-xs text-blue-300">
                        Simulation combines fundamental scores with macro sensitivity to model realistic Indian equity price movements.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
