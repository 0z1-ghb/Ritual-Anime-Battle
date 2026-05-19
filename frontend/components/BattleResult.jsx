"use client";

export default function BattleResult({ result }) {
  if (!result) return null;

  return (
    <div className="border border-[#22ff88]/40 bg-[#22ff88]/5 rounded-lg p-6 text-center">
      <h2 className="text-2xl font-bold text-[#22ff88] mb-2">Battle #{result.battleId}</h2>
      <p className="text-lg text-white mb-1">
        <span className="text-[#22ff88] font-bold">{result.winnerName}</span>
        {" defeats "}
        <span className="text-red-400 font-bold">{result.loserName}</span>
      </p>
      <p className="text-sm text-gray-400">
        {new Date(Number(result.timestamp) * 1000).toLocaleString()}
      </p>
    </div>
  );
}
