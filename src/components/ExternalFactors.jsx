import { factorDefinitions, scenarios } from "../data/externalFactors";

export default function ExternalFactors({ factors, setFactors }) {
  const handleChange = (id, value) => {
    setFactors((prev) => ({ ...prev, [id]: parseFloat(value) }));
  };

  const applyScenario = (scenario) => {
    setFactors({ ...scenario.factors });
  };

  return (
    <div className="space-y-5">
      {/* Scenario presets */}
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">
          Quick Scenarios
        </p>
        <div className="grid grid-cols-2 gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => applyScenario(s)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-lg border border-gray-700 transition-colors text-left"
              title={s.description}
            >
              <span className="mr-1">{s.emoji}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Factor sliders */}
      <div>
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
          Market Factors
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
