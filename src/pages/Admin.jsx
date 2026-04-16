import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import localStocks from "../data/stocks";

// ─── Field config ─────────────────────────────────────────────────────────────
const fundamentalFields = [
  { key: "salesCr", label: "Sales (Cr)", step: 100 },
  { key: "salesYoY", label: "Sales YoY Growth", step: 0.001, isDecimal: true },
  { key: "opm", label: "Operating Profit Margin (OPM)", step: 0.001, isDecimal: true },
  { key: "npm", label: "Net Profit Margin (NPM)", step: 0.001, isDecimal: true },
  { key: "cfoCr", label: "CFO (Cr)", step: 100 },
  { key: "cfoMargin", label: "CFO Margin", step: 0.001, isDecimal: true },
  { key: "cfoToNP", label: "CFO / Net Profit", step: 0.01 },
  { key: "netCashCr", label: "Net Cash (Cr)", step: 100 },
  { key: "debtToEquity", label: "Debt to Equity", step: 0.01 },
  { key: "pe", label: "P/E Ratio", step: 0.1 },
  { key: "epsINR", label: "EPS (INR)", step: 0.01 },
  { key: "peg3Y", label: "PEG (3 Year)", step: 0.01 },
];

const sensitivityFields = [
  { key: "globalSentiment", label: "Global Sentiment" },
  { key: "rbiRate", label: "RBI Rate" },
  { key: "gdpGrowth", label: "GDP Growth" },
  { key: "fiiFlows", label: "FII Flows" },
  { key: "monsoon", label: "Monsoon" },
  { key: "govtPolicy", label: "Govt Policy" },
  { key: "rupeeDollar", label: "USD/INR" },
];

const sectors = [
  "IT Services",
  "Banking & Financials",
  "Pharma & Healthcare",
  "Energy",
  "Consumer Staples",
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [fetchLoading, setFetchLoading] = useState(true);

  // ── Auth guard ──
  if (!loading && (!user || !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  // ── Fetch stocks ──
  useEffect(() => {
    async function fetchStocks() {
      if (!db) {
        setStocks(localStocks);
        setFetchLoading(false);
        selectStock(localStocks[0]);
        return;
      }
      try {
        const snapshot = await getDocs(collection(db, "stocks"));
        if (!snapshot.empty) {
          const fsStocks = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
          const merged = localStocks.map((local) => {
            const remote = fsStocks.find((s) => s.id === local.id);
            return remote ? { ...local, ...remote } : local;
          });
          setStocks(merged);
          selectStock(merged[0]);
        } else {
          setStocks(localStocks);
          selectStock(localStocks[0]);
        }
      } catch {
        setStocks(localStocks);
        selectStock(localStocks[0]);
      } finally {
        setFetchLoading(false);
      }
    }
    if (!loading && user && isAdmin) fetchStocks();
  }, [loading, user, isAdmin]);

  function selectStock(stock) {
    setSelectedId(stock.id);
    setFormData(deepClone(stock));
    setMessage(null);
  }

  function setBasic(key, value) {
    setFormData((prev) => ({
      ...prev,
      [key]: key === "basePrice" ? parseFloat(value) || 0 : value,
    }));
  }

  function setFundamental(key, value) {
    setFormData((prev) => ({
      ...prev,
      fundamentals: {
        ...prev.fundamentals,
        [key]: parseFloat(value) || 0,
      },
    }));
  }

  function setSensitivity(key, value) {
    setFormData((prev) => ({
      ...prev,
      sectorSensitivity: {
        ...prev.sectorSensitivity,
        [key]: parseFloat(value) || 0,
      },
    }));
  }

  async function handleSave() {
    if (!db || !formData) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, "stocks", formData.id), {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      setMessage({ type: "success", text: `✓ ${formData.name} saved to Firestore` });
      setStocks((prev) =>
        prev.map((s) => (s.id === formData.id ? { ...formData } : s))
      );
    } catch (e) {
      setMessage({ type: "error", text: `✕ ${e.message}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleSeedAll() {
    if (!db) return;
    setSaving(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      localStocks.forEach((stock) => {
        batch.set(doc(db, "stocks", stock.id), {
          ...stock,
          seededAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setStocks(localStocks);
      setMessage({ type: "success", text: "✓ All 5 stocks seeded to Firestore" });
    } catch (e) {
      setMessage({ type: "error", text: `✕ ${e.message}` });
    } finally {
      setSaving(false);
    }
  }

  if (loading || fetchLoading) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-gray-400">Loading admin panel…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Navbar />

      <motion.div
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded font-mono uppercase tracking-widest">
                Admin
              </span>
              <h1 className="text-2xl font-bold text-white">Stock Management</h1>
            </div>
            <p className="text-sm text-gray-400">
              Edit stock fundamentals and sector sensitivities. Changes save to Firestore and are reflected live in the simulator.
            </p>
          </div>
          <div className="flex gap-2">
            {!isFirebaseConfigured && (
              <span className="px-3 py-2 bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-xs rounded-lg">
                Firebase not configured — changes won't persist
              </span>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSeedAll}
              disabled={saving || !isFirebaseConfigured}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 rounded-lg border border-gray-600 transition-colors font-medium"
            >
              ↑ Seed All Stocks to DB
            </motion.button>
          </div>
        </div>

        {/* Message banner */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${
                message.type === "success"
                  ? "bg-green-900/30 border-green-700/50 text-green-300"
                  : "bg-red-900/30 border-red-700/50 text-red-300"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-5">
          {/* Left: Stock list */}
          <div className="col-span-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
              Stocks
            </p>
            <div className="space-y-2">
              {stocks.map((stock) => (
                <motion.button
                  key={stock.id}
                  whileHover={{ x: 3 }}
                  onClick={() => selectStock(stock)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedId === stock.id
                      ? "bg-gray-800 border-blue-500/60"
                      : "bg-gray-800/40 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: stock.color }}
                    >
                      {stock.id.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{stock.name}</p>
                      <p className="text-[11px] text-gray-400">{stock.sector}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-gray-500 font-mono">
                    <span>Base: ₹{stock.basePrice.toLocaleString("en-IN")}</span>
                    <span>P/E {stock.fundamentals.pe.toFixed(1)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right: Edit form */}
          {formData && (
            <motion.div
              key={formData.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="col-span-9 space-y-5"
            >
              {/* Basic Info */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  />
                  Basic Information
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    label="Ticker ID"
                    value={formData.id}
                    disabled
                    hint="Cannot change ID"
                  />
                  <FormField
                    label="Company Name"
                    value={formData.name}
                    onChange={(v) => setBasic("name", v)}
                  />
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Sector</label>
                    <select
                      value={formData.sector}
                      onChange={(e) => setBasic("sector", e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {sectors.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <FormField
                    label="Base Price (₹)"
                    value={formData.basePrice}
                    type="number"
                    onChange={(v) => setBasic("basePrice", v)}
                  />
                </div>
                <div className="mt-4">
                  <label className="text-xs text-gray-400 mb-1 block">Sector Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setBasic("color", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-600 bg-gray-900 cursor-pointer p-0.5"
                    />
                    <span className="text-sm text-gray-400 font-mono">{formData.color}</span>
                  </div>
                </div>
              </div>

              {/* Fundamentals */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <h3 className="text-white font-semibold mb-1">Key Parameters (Latest FY)</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Based on CSV columns: Sales_cr, OPM, NPM, CFO_cr, CFO_margin, CFO_to_NP, NetCash_cr, Debt_to_Equity, PE, EPS_INR, PEG_3Y
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {fundamentalFields.map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                      <input
                        type="number"
                        step={f.step}
                        value={formData.fundamentals[f.key] ?? 0}
                        onChange={(e) => setFundamental(f.key, e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                      {f.isDecimal && (
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          = {((formData.fundamentals[f.key] || 0) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Sensitivity */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <h3 className="text-white font-semibold mb-1">Sector Sensitivity Weights</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Range: −1.0 (strongly negative) to +1.0 (strongly positive). Controls how much each macro factor affects this stock's price.
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {sensitivityFields.map((f) => {
                    const val = formData.sectorSensitivity[f.key] ?? 0;
                    return (
                      <div key={f.key}>
                        <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                        <input
                          type="number"
                          step={0.05}
                          min={-1}
                          max={1}
                          value={val}
                          onChange={(e) => setSensitivity(f.key, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
                          style={{ color: val > 0 ? "#34d399" : val < 0 ? "#f87171" : "#9ca3af" }}
                        />
                        <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.abs(val) * 100}%`,
                              backgroundColor: val >= 0 ? "#10B981" : "#EF4444",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Last saved data will override simulator's local defaults for all users.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving || !isFirebaseConfigured}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
                >
                  {saving ? "Saving…" : `Save ${formData.name} to Firestore`}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reusable form field ──────────────────────────────────────────────────────
function FormField({ label, value, onChange, type = "text", disabled, hint }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        }`}
      />
      {hint && <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p>}
    </div>
  );
}
