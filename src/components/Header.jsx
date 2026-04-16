export default function Header() {
  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Indian Stock Market Simulator
            </h1>
            <p className="text-xs text-gray-400">
              NSE / BSE &middot; 5 Sectors &middot; Fundamental + Macro Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded font-mono border border-green-800">
            NIFTY 50
          </span>
          <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded font-mono border border-gray-700">
            SIMULATION MODE
          </span>
        </div>
      </div>
    </header>
  );
}
