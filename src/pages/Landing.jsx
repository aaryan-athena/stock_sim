import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import Navbar from "../components/Navbar";

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardHover = {
  rest: { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  hover: { y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", transition: { duration: 0.25 } },
};

// ─── Static data ─────────────────────────────────────────────────────────────
const floatingBadges = [
  { id: "INFY", change: "+2.3%", positive: true, top: "18%", left: "6%" },
  { id: "HDFC", change: "-0.8%", positive: false, top: "32%", right: "5%" },
  { id: "SUNP", change: "+1.5%", positive: true, top: "62%", left: "4%" },
  { id: "RELI", change: "+3.1%", positive: true, top: "70%", right: "6%" },
  { id: "NEST", change: "-0.4%", positive: false, top: "48%", left: "8%" },
];

const stats = [
  { value: 5, suffix: "", label: "Sectors Covered" },
  { value: 7, suffix: "", label: "Macro Factors" },
  { value: 12, suffix: " Qtrs", label: "Simulation Period" },
  { value: 10, suffix: "L", label: "Starting Capital" },
];

const features = [
  {
    icon: "📊",
    title: "Fundamental Analysis",
    desc: "Every stock is modelled on real parameters — revenue growth, operating margins, cash flows, debt ratios, and valuation multiples derived from 10 years of BSE/NSE data.",
    color: "from-blue-600/20 to-blue-600/5",
    border: "border-blue-600/30",
  },
  {
    icon: "🌐",
    title: "7 Macro Factors",
    desc: "Control RBI repo rate, GDP growth, FII/FPI flows, USD/INR exchange rate, monsoon quality, global sentiment, and government policy — all with sector-specific sensitivity weights.",
    color: "from-green-600/20 to-green-600/5",
    border: "border-green-600/30",
  },
  {
    icon: "💼",
    title: "Portfolio Simulation",
    desc: "Buy and sell across 5 sectors with ₹10 lakh starting capital. Track real-time P&L, sector allocation, and compare your returns against simulated benchmarks.",
    color: "from-purple-600/20 to-purple-600/5",
    border: "border-purple-600/30",
  },
  {
    icon: "⚡",
    title: "Scenario Presets",
    desc: "One-click presets for Bull Run, Bear Market, IT Export Boom, Monsoon Failure, and Policy Reform scenarios — instantly stress-test any portfolio against market extremes.",
    color: "from-orange-600/20 to-orange-600/5",
    border: "border-orange-600/30",
  },
];

const steps = [
  {
    num: "01",
    icon: "🎛️",
    title: "Set Market Conditions",
    desc: "Choose a scenario preset or fine-tune 7 macroeconomic sliders — from RBI rates to monsoon quality.",
  },
  {
    num: "02",
    icon: "▶",
    title: "Run the Simulation",
    desc: "The engine scores each stock's fundamentals against your macro environment and projects prices over 12 quarters.",
  },
  {
    num: "03",
    icon: "📈",
    title: "Analyze & Invest",
    desc: "Read the price charts, sector heatmap, and breakdown table. Build your portfolio and see how your picks perform.",
  },
];

const sectors = [
  { name: "IT Services", ticker: "INFY", desc: "Export-driven, USD earner", color: "#3B82F6", tag: "Growth" },
  { name: "Banking & Financials", ticker: "HDFC", desc: "Rate-sensitive, FII-driven", color: "#10B981", tag: "Cyclical" },
  { name: "Pharma & Healthcare", ticker: "SUNP", desc: "Defensive, policy-sensitive", color: "#F59E0B", tag: "Defensive" },
  { name: "Energy", ticker: "RELI", desc: "Crude-linked, govt policy", color: "#EF4444", tag: "Cyclical" },
  { name: "Consumer Staples", ticker: "NEST", desc: "Monsoon & rural demand", color: "#8B5CF6", tag: "Defensive" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
    >
      <motion.span
        initial={{ innerText: 0 }}
        animate={inView ? { innerText: value } : { innerText: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        onUpdate={(latest) => {
          if (ref.current) {
            ref.current.querySelector(".num").textContent =
              Math.round(latest.innerText ?? 0) + suffix;
          }
        }}
      >
        <span className="num">0{suffix}</span>
      </motion.span>
    </motion.span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  const scrollToFeatures = () =>
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="bg-[#050a14] text-white min-h-screen">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "5%", left: "5%" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-green-600/10 blur-[100px] pointer-events-none"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "40%", right: "8%" }}
        />
        <motion.div
          className="absolute w-[350px] h-[350px] rounded-full bg-orange-600/8 blur-[100px] pointer-events-none"
          animate={{ x: [0, 25, -15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "10%", left: "30%" }}
        />

        {/* Floating stock badges */}
        {floatingBadges.map((b, i) => (
          <motion.div
            key={b.id}
            className="absolute hidden lg:flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-gray-700/60 rounded-xl px-3 py-2 shadow-lg"
            style={{ top: b.top, left: b.left, right: b.right }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3.5 + i * 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            <span className="text-xs font-mono text-gray-300 font-semibold">{b.id}</span>
            <span className={`text-xs font-mono font-bold ${b.positive ? "text-green-400" : "text-red-400"}`}>
              {b.change}
            </span>
          </motion.div>
        ))}

        {/* Hero content */}
        <motion.div
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              NSE · BSE · Simulation Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Simulate the{" "}
            <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
              Indian
            </span>
            <br />
            Stock Market
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Combine real company fundamentals with macroeconomic factors — RBI
            rates, GDP growth, FII flows, monsoon and more — to project stock
            prices across 5 major sectors.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/simulator")}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/40 transition-all text-base"
            >
              Start Simulating →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToFeatures}
              className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl border border-gray-700 transition-all text-base"
            >
              See How It Works
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#050a14] to-transparent pointer-events-none" />
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/40">
        <motion.div
          className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white font-mono">
                {s.value}
                {s.suffix}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section ref={featuresRef} className="max-w-7xl mx-auto px-4 py-24">
        <motion.div
          className="text-center mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <span className="text-sm text-blue-400 font-semibold uppercase tracking-widest">Platform Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
            Built on real market mechanics
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Every parameter, factor, and formula is grounded in how Indian equities actually behave.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover="hover"
              initial="rest"
              animate="rest"
              custom={cardHover}
              className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 cursor-default`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-24">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span className="text-sm text-green-400 font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
              Three steps to a simulation
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />

            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <div className="relative inline-flex">
                  <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl mb-5 mx-auto shadow-lg">
                    {s.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTORS ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <motion.div
          className="text-center mb-12"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <span className="text-sm text-orange-400 font-semibold uppercase tracking-widest">Coverage</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
            5 sectors, 5 leading stocks
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Each sector has distinct macro sensitivities, valuation profiles, and growth drivers.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {sectors.map((s) => (
            <motion.div
              key={s.name}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-5 cursor-default"
              style={{ borderTopColor: s.color, borderTopWidth: 3 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold mb-4 shadow"
                style={{ backgroundColor: s.color + "33", color: s.color }}
              >
                {s.ticker}
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{s.name}</h3>
              <p className="text-gray-500 text-xs mb-3 leading-snug">{s.desc}</p>
              <span className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                style={{ backgroundColor: s.color + "20", color: s.color }}>
                {s.tag}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 via-gray-900 to-green-950/60" />
        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center px-4"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Ready to master the market?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-10">
            No real money. No risk. Just real mechanics.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/simulator")}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-900/40 text-base"
            >
              Launch Simulator →
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white text-[10px] font-bold">S</div>
            <span className="text-gray-400 text-sm font-medium">StockSim India</span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            For educational purposes only. Not financial advice. Data is simulated.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <Link to="/simulator" className="hover:text-gray-300 transition-colors">Simulator</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
