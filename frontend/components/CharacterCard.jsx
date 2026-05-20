"use client";
import { useState, useMemo } from "react";

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PALETTES = [
  ["#7c3aed", "#a855f7"], ["#2563eb", "#3b82f6"], ["#059669", "#34d399"],
  ["#d97706", "#f59e0b"], ["#dc2626", "#ef4444"], ["#db2777", "#ec4899"],
  ["#0891b2", "#06b6d4"], ["#65a30d", "#84cc16"], ["#4f46e5", "#6366f1"],
  ["#ea580c", "#f97316"], ["#0d9488", "#14b8a6"], ["#9333ea", "#c084fc"],
];

function getPalette(name) {
  return PALETTES[hashStr(name) % PALETTES.length];
}

export default function CharacterCard({ character, onBattle, disabled }) {
  const [usePng, setUsePng] = useState(true);
  const palette = useMemo(() => getPalette(character.name), [character.name]);
  const initial = character.name.charAt(0).toUpperCase();

  return (
    <div className="border border-gray-700/60 rounded p-1 bg-gray-900/80 hover:border-[#22ff88] transition-colors">
      {usePng ? (
        <img
          src={`/characters/${Number(character.id) + 1}.png`}
          alt={character.name}
          className="w-full h-14 rounded mb-1 object-contain bg-gray-800"
          onError={() => setUsePng(false)}
        />
      ) : (
        <svg width="100%" height="56" viewBox="0 0 200 56" preserveAspectRatio="none" className="rounded mb-1 block">
          <defs>
            <linearGradient id={`grad-${character.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette[0]} />
              <stop offset="100%" stopColor={palette[1]} />
            </linearGradient>
          </defs>
          <rect width="200" height="56" rx="4" fill={`url(#grad-${character.id})`} />
          <text x="100" y="36" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            {initial}
          </text>
          <text x="196" y="50" textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="7" fontWeight="500">
            {character.anime.length > 20 ? character.anime.slice(0, 19) + "…" : character.anime}
          </text>
        </svg>
      )}
      <h3 className="text-[9px] font-bold text-white truncate leading-none">{character.name}</h3>
      <p className="text-[8px] text-gray-400 truncate leading-none">{character.anime}</p>
      <div className="mt-0.5 flex items-center gap-0.5">
        <div className="flex-1 bg-gray-700 rounded-full h-0.5">
          <div className="bg-[#22ff88] h-0.5 rounded-full" style={{ width: `${character.power}%` }} />
        </div>
        <span className="text-[8px] text-[#22ff88] font-mono">{character.power}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[8px] text-[#22ff88] font-semibold">
          W:{String(character.wins ?? 0)}
        </span>
        <span className="text-[8px] text-red-400 font-semibold">
          L:{String(character.losses ?? 0)}
        </span>
      </div>
      <button
        onClick={() => onBattle(Number(character.id))}
        disabled={disabled}
        className="mt-0.5 w-full py-px bg-transparent border border-[#22ff88] text-[#22ff88] hover:bg-[#22ff88] hover:text-black disabled:opacity-30 disabled:cursor-not-allowed text-[8px] font-bold rounded leading-none transition-colors"
      >
        {disabled ? "..." : "⚔️"}
      </button>
    </div>
  );
}
