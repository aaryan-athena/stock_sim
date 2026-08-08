import { factorDefinitions, scenarios, buildFactorPath } from "../data/externalFactors";

const QUARTERS = 12;

export default function ExternalFactors({
  factors,
  setFactors,
  activeScenario,
  onApplyScenario,
  onClearScenario,
}) {
  // Dragging any slider means the user has left the scripted path and is now
  // driving a flat, custom set of factors.
  const handleChange = (id, value) => {
    setFactors((prev) => ({ ...prev, [id]: parseFloat(value) }));
    onClearScenario();
  };

  const path = activeScenario ? buildFactorPath(activeScenario, QUARTERS) : null;

  return (
    <div className="space-y-5">
      {/* Scenario presets */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">
          Scripted Scenarios
        </p>
        <div className="grid grid-cols-2 gap-2">
          {scenarios.map((s) => {
            const isActive = activeScenario?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onApplyScenario(s)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors text-left ${
                  isActive
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                }`}
                title={s.description}
              >
                <span className="mr-1">{s.emoji}</span>
                {s.name}
              </button>
            );
          })}
        </div>

        {activeScenario ? (
          <ScenarioTimeline scenario={activeScenario} path={path} />
        ) : (
          <p className="text-[11px] text-gray-500 mt-2 leading-tight">
            Custom factors — held flat across all {QUARTERS} quarters. Pick a scenario to run a
            scripted macro path instead.
          </p>
        )}
      </div>

      {/* Factor sliders */}
      <div>
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
          Market Factors {activeScenario && <span className="normal-case">(Q1 of path)</span>}
        </p>
        <div className="space-y-5">
          {factorDefinitions.map((def) => {
            const value = factors[def.id] ?? def.default;
            const mid = (def.max + def.min) / 2;
            const isPositive = value > mid;
            const isNegative = value < mid;
            return (
              <div key={def.id}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-300 font-medium">
                    {def.name}
                  </label>
                  <span
                    className={`text-sm font-mono font-semibold ${
                      isPositive
                        ? "text-green-400"
                        : isNegative
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {value}{def.unit !== "score" ? def.unit : ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={value}
                  onChange={(e) => handleChange(def.id, e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                {path && <FactorSparkline def={def} path={path} />}
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>{def.min}{def.unit !== "score" ? def.unit : ""}</span>
                  <span>{def.max}{def.unit !== "score" ? def.unit : ""}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                  {def.impact}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// The scenario's narrative beats, in quarter order.
function ScenarioTimeline({ scenario, path }) {
  const frames = [...scenario.keyframes].sort((a, b) => a.quarter - b.quarter);

  return (
    <div className="mt-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
      <p className="text-[11px] text-gray-400 mb-2 leading-tight">{scenario.description}</p>
      <div className="space-y-2">
        {frames.map((f) => (
          <div key={f.quarter} className="flex gap-2">
            <span className="text-[10px] font-mono text-blue-400 shrink-0 pt-px w-6">
              Q{f.quarter}
            </span>
            <p className="text-[11px] text-gray-400 leading-tight">{f.note}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 mt-2">
        {path?.length ?? 0} quarterly factor sets interpolated between {frames.length} keyframes.
      </p>
    </div>
  );
}

// Tiny inline plot of one factor's scripted path across the horizon.
function FactorSparkline({ def, path }) {
  const values = path.map((p) => p[def.id]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const flat = max - min < 1e-9;

  const W = 100;
  const H = 16;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * W;
      const y = flat ? H / 2 : H - ((v - min) / (max - min)) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="mt-1" title={`Scripted path: ${values.join(" → ")}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-4">
        <polyline
          points={points}
          fill="none"
          stroke={flat ? "#6B7280" : "#60A5FA"}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="text-[9px] text-gray-600 leading-none">
        {flat
          ? "flat across horizon"
          : `Q1 ${values[0]}${def.unit !== "score" ? def.unit : ""} → Q${values.length} ${
              values[values.length - 1]
            }${def.unit !== "score" ? def.unit : ""}`}
      </p>
    </div>
  );
}
