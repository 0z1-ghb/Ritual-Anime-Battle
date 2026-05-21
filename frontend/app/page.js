"use client";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { parseGwei } from "viem";
import { decodeEventLog } from "viem";
import { readContract, writeContract, watchContractEvent, waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../lib/useWagmiConfig";
import { CONTRACT_ADDRESS, CONTRACT_ABI, RITUAL_CHAIN } from "../lib/config";
import CharacterCard from "../components/CharacterCard";
import LoadingScreen from "../components/LoadingScreen";
import Leaves from "../components/Leaves";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connectors } = useConnect();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [showBattleScreen, setShowBattleScreen] = useState(false);
  const [playerCharId, setPlayerCharId] = useState(null);
  const [battleError, setBattleError] = useState(null);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [activeTab, setActiveTab] = useState("characters");
  const [battleHistory, setBattleHistory] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [leaderboardSubTab, setLeaderboardSubTab] = useState("characters");
  const [allPlayers, setAllPlayers] = useState([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  const fetchCharacters = useCallback(async () => {
    try {
      const data = await readContract(config, {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAllCharacters",
      });
      setCharacters(data);
    } catch (e) {
      console.log("Not deployed yet, using demo data");
      setCharacters([]);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const fetchPlayerData = useCallback(async (addr) => {
    if (!addr) return;
    setHistoryLoading(true);
    try {
      const [stats, history] = await Promise.all([
        readContract(config, { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "getPlayerStats", args: [addr] }),
        readContract(config, { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "getPlayerBattles", args: [addr, 0n, 50n] }),
      ]);
      setPlayerStats(stats);
      setBattleHistory(history);
    } catch (e) {
      console.log("Failed to fetch player data", e);
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (isConnected && (activeTab === "leaderboard" || activeTab === "history")) {
      fetchPlayerData(address);
    }
  }, [activeTab, isConnected, address, fetchPlayerData]);

  useEffect(() => {
    if (activeTab === "leaderboard" && leaderboardSubTab === "players") {
      const fetch = async () => {
        try {
          const data = await readContract(config, {
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getAllPlayers",
          });
          setAllPlayers(data);
        } catch (e) {
          console.log("Failed to fetch all players", e);
        }
      };
      fetch();
    }
  }, [activeTab, leaderboardSubTab]);

  useEffect(() => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x" + "0".repeat(40)) return;
    const unwatch = watchContractEvent(config, {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      eventName: "BattleResult",
      onLogs(logs) {
        fetchCharacters();
        fetchPlayerData(address);
      },
    });
    return () => unwatch();
  }, [fetchPlayerData, address]);

  const handleBattle = async (charId) => {
    if (!isConnected) return;
    setPending(true);
    setBattleResult(null);
    setBattleError(null);
    setShowBattleScreen(true);
    setPlayerCharId(charId);
    try {
      const txHash = await writeContract(config, {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "battle",
        args: [BigInt(charId)],
        gas: 500000n,
        maxFeePerGas: parseGwei("1"),
        maxPriorityFeePerGas: parseGwei("0.1"),
      });
      setLastTxHash(txHash);
      const receipt = await waitForTransactionReceipt(config, { hash: txHash });

      if (receipt.status === "reverted") {
        setBattleError("Transaction reverted on-chain");
        setPending(false);
        fetchCharacters();
        return;
      }

      let found = false;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: CONTRACT_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "BattleResult") {
            const args = decoded.args;
            const wId = args.winnerId?.toString();
            const lId = args.loserId?.toString();
            setBattleResult({
              battleId: args.battleId?.toString(),
              winnerName: args.winnerName,
              loserName: args.loserName,
              winnerId: wId,
              loserId: lId,
              timestamp: args.timestamp?.toString(),
            });
            setPending(false);
            setCharacters((prev) =>
              prev.map((c) => {
                const id = c.id?.toString();
                if (id === wId) return { ...c, wins: (Number(c.wins) + 1).toString() };
                if (id === lId) return { ...c, losses: (Number(c.losses) + 1).toString() };
                return c;
              })
            );
            found = true;
            break;
          }
        } catch (_) {}
      }

      if (!found) {
        setBattleError("Battle result not found in receipt");
        setPending(false);
        fetchCharacters();
      }
    } catch (e) {
      setBattleError(e?.shortMessage || e?.message || "Transaction failed");
      setPending(false);
    }
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} onLoaded={handleLoaded} />
      <Leaves />
      <div className={`min-h-screen transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}`}
        style={{
          backgroundImage: "url('/anime-character.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
      <div className="fixed left-4 md:left-6 text-center" style={{ zIndex: 20, top: "24px" }}>
        <h1 className="text-4xl md:text-6xl lg:text-8xl tracking-wide" style={{
          fontFamily: "AngillaTattoo, serif",
          color: "#22ff88",
          textShadow: "0 0 10px rgba(34,255,136,0.6), 0 0 40px rgba(34,255,136,0.3)",
          opacity: isLoading ? 0 : 1,
          transform: isLoading ? "translateY(20px)" : "translateY(0)",
          transition: isLoading ? "none" : "all 1.8s ease-out",
        }}>
          Anime Battle Arena
        </h1>
        <p className="text-lg md:text-xl lg:text-3xl tracking-widest" style={{
          fontFamily: "AngillaTattoo, serif",
          color: "#ffffff",
          opacity: isLoading ? 0 : 0.8,
          transform: isLoading ? "translateY(12px)" : "translateY(0)",
          transition: isLoading ? "none" : "all 1.8s ease-out 0.4s",
        }}>
          ON-CHAIN BATTLE ARENA
        </p>
      </div>
      <main className="fixed left-2 right-2 md:left-6 md:w-4/5 max-w-4xl pt-6 md:pt-10 p-3 md:p-6 overflow-y-auto backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-xl hide-scrollbar relative max-h-[68vh] top-[90px] lg:top-[170px]">
        {isMounted && isConnected && (
          <button
            onClick={() => connectors[0]?.disconnect?.()}
            className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-[#22ff88] border border-[#22ff88] bg-transparent hover:bg-[#22ff88] hover:text-black rounded transition-colors"
          >
            Disconnect
          </button>
        )}

        {!isMounted ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-white/60">Loading...</div>
          </div>
        ) : !isConnected ? (
          <div className="py-6 text-center">
            <p className="text-white/90 mb-5 text-sm md:text-base lg:text-xl font-semibold tracking-wide text-center" style={{ fontFamily: "AngillaTattoo, serif" }}>
              battle your favorite anime characters on-chain
            </p>
            <button
              onClick={() => connectors[0]?.connect?.()}
              className="w-auto px-4 py-1.5 font-bold text-xs text-[#22ff88] border border-[#22ff88] bg-transparent hover:bg-[#22ff88] hover:text-black rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : showBattleScreen ? (
          <div className="py-6">
            {(() => {
              const pChar = characters.find((c) => Number(c.id) === playerCharId);
              const hasResult = battleResult;
              const oppId = hasResult
                ? (Number(battleResult.winnerId) === playerCharId
                    ? Number(battleResult.loserId)
                    : Number(battleResult.winnerId))
                : null;
              const oChar = oppId !== null ? characters.find((c) => Number(c.id) === oppId) : null;
              const isWinner = hasResult && Number(battleResult.winnerId) === playerCharId;
              return (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center justify-center gap-8 w-full">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-24 h-32 rounded-lg overflow-hidden bg-gray-800/60 flex items-center justify-center ${hasResult ? (isWinner ? "shadow-[0_0_15px_#22ff88,0_0_30px_rgba(34,255,136,0.3)]" : "shadow-[0_0_15px_#ef4444,0_0_30px_rgba(239,68,68,0.3)]") : ""}`}>
                        <img
                          src={`/characters/${Number(pChar?.id || 0) + 1}.png`}
                          alt={pChar?.name || "?"}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-white font-bold text-sm">{pChar?.name || "?"}</span>
                      <span className="text-gray-300 text-xs">{pChar?.anime || ""}</span>
                      {hasResult && (
                        <span className="text-[11px] font-semibold">
                          <span className="text-[#22ff88]">W:{pChar?.wins?.toString() || "0"}</span>
                          <span className="text-[#ff2244]"> L:{pChar?.losses?.toString() || "0"}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-4xl font-bold text-[#22ff88]" style={{ textShadow: "0 0 20px rgba(34,255,136,0.5)" }}>
                      VS
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      {hasResult ? (
                        <>
                          <div className={`w-24 h-32 rounded-lg overflow-hidden bg-gray-800/60 flex items-center justify-center ${isWinner ? "shadow-[0_0_15px_#ef4444,0_0_30px_rgba(239,68,68,0.3)]" : "shadow-[0_0_15px_#22ff88,0_0_30px_rgba(34,255,136,0.3)]"}`}>
                            <img
                              src={`/characters/${Number(oChar?.id || 0) + 1}.png`}
                              alt={oChar?.name || "?"}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-white font-bold text-sm">{oChar?.name || "?"}</span>
                          <span className="text-gray-300 text-xs">{oChar?.anime || ""}</span>
                          {hasResult && (
                            <span className="text-[11px] font-semibold">
                              <span className="text-[#22ff88]">W:{oChar?.wins?.toString() || "0"}</span>
                              <span className="text-[#ff2244]"> L:{oChar?.losses?.toString() || "0"}</span>
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-24 h-32 rounded-lg bg-gray-800/40 flex items-center justify-center">
                          <span className="text-gray-500 text-2xl">?</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {hasResult && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">
                        {Number(battleResult.winnerId) === playerCharId ? (
                          <span className="text-[#22ff88]">Victory!</span>
                        ) : (
                          <span className="text-red-400">Defeat</span>
                        )}
                      </p>
                      <button
                        onClick={() => { setShowBattleScreen(false); setBattleResult(null); setBattleError(null); setLastTxHash(null); fetchCharacters(); }}
                        className="mt-4 px-6 py-2 text-sm font-semibold text-[#22ff88] border border-[#22ff88] bg-transparent hover:bg-[#22ff88] hover:text-black rounded-lg transition-colors"
                      >
                        Back to Arena
                      </button>
                      {lastTxHash && (
                        <p className="mt-3">
                          <a
                            href={`https://explorer.ritualfoundation.org/tx/${lastTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-gray-400 hover:text-[#22ff88] underline underline-offset-2 transition-colors"
                          >
                            View on Explorer →
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                  {pending && !hasResult && (
                    <div className="text-[#22ff88] text-sm flex items-center gap-1">
                      <span>Waiting for battle result</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-[#22ff88] rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                        <span className="w-1 h-1 bg-[#22ff88] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1 h-1 bg-[#22ff88] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      </span>
                    </div>
                  )}
                  {battleError && !hasResult && (
                    <div className="text-center">
                      <p className="text-red-400 text-sm mb-3">{battleError}</p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => handleBattle(playerCharId)}
                          className="px-4 py-1.5 text-xs font-semibold text-[#22ff88] border border-[#22ff88] bg-transparent hover:bg-[#22ff88] hover:text-black rounded-lg transition-colors"
                        >
                          Retry
                        </button>
                        <button
                        onClick={() => { setShowBattleScreen(false); setBattleResult(null); setBattleError(null); fetchCharacters(); }}
                          className="px-4 py-1.5 text-xs font-semibold text-gray-400 border border-gray-600 bg-transparent hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab("characters")}
                className={`text-xs font-semibold tracking-wider transition-colors pb-1 ${
                  activeTab === "characters"
                    ? "text-[#22ff88] border-b-2 border-[#22ff88]"
                    : "text-white/40 hover:text-white/80 border-b-2 border-transparent"
                }`}
              >
                CHARACTERS
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`text-xs font-semibold tracking-wider transition-colors pb-1 ${
                  activeTab === "leaderboard"
                    ? "text-[#22ff88] border-b-2 border-[#22ff88]"
                    : "text-white/40 hover:text-white/80 border-b-2 border-transparent"
                }`}
              >
                LEADERBOARD
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`text-xs font-semibold tracking-wider transition-colors pb-1 ${
                  activeTab === "history"
                    ? "text-[#22ff88] border-b-2 border-[#22ff88]"
                    : "text-white/40 hover:text-white/80 border-b-2 border-transparent"
                }`}
              >
                HISTORY
              </button>
            </div>
            {activeTab === "characters" ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id.toString()}
                    character={char}
                    onBattle={handleBattle}
                    disabled={pending}
                  />
                ))}
              </div>
            ) : activeTab === "leaderboard" ? (
              <div>
                {playerStats && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 text-xs">
                    <span className="text-gray-400">Your Record</span>
                    <span className="text-[#22ff88] font-semibold">{Number(playerStats.wins ?? 0)}W</span>
                    <span className="text-red-400 font-semibold">{Number(playerStats.losses ?? 0)}L</span>
                    <span className="text-gray-500">|</span>
                    {(() => {
                      const total = Number(playerStats.wins) + Number(playerStats.losses);
                      const pct = total > 0 ? Math.round((Number(playerStats.wins) / total) * 100) : 0;
                      return (
                    <span className={total > 0 ? (pct >= 50 ? "text-[#22ff88]" : "text-red-400") : "text-gray-500"}>
                      {total > 0 ? `${pct}%` : "-"}
                    </span>
                      );
                    })()}
                  </div>
                )}
                <div className="flex gap-3 mb-2 border-b border-white/10 pb-1">
                  <button
                    onClick={() => setLeaderboardSubTab("characters")}
                    className={`text-[11px] font-semibold tracking-wider transition-colors pb-1 ${
                      leaderboardSubTab === "characters"
                        ? "text-[#22ff88] border-b-2 border-[#22ff88]"
                        : "text-white/40 hover:text-white/80 border-b-2 border-transparent"
                    }`}
                  >
                    CHARACTERS
                  </button>
                  <button
                    onClick={() => setLeaderboardSubTab("players")}
                    className={`text-[11px] font-semibold tracking-wider transition-colors pb-1 ${
                      leaderboardSubTab === "players"
                        ? "text-[#22ff88] border-b-2 border-[#22ff88]"
                        : "text-white/40 hover:text-white/80 border-b-2 border-transparent"
                    }`}
                  >
                    PLAYERS
                  </button>
                </div>
                {leaderboardSubTab === "characters" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#22ff88] border-b border-white/10">
                        <th className="text-left py-2 pr-2 font-semibold">#</th>
                        <th className="text-left py-2 pr-2 font-semibold">Character</th>
                        <th className="text-left py-2 pr-2 font-semibold">Anime</th>
                        <th className="text-center py-2 pr-2 font-semibold">⚡</th>
                        <th className="text-center py-2 pr-2 font-semibold">W</th>
                        <th className="text-center py-2 pr-2 font-semibold">L</th>
                        <th className="text-center py-2 font-semibold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...characters]
                        .sort((a, b) => Number(b.wins ?? 0) - Number(a.wins ?? 0))
                        .map((char, i) => {
                          const w = Number(char.wins ?? 0);
                          const l = Number(char.losses ?? 0);
                          const total = w + l;
                          const pct = total > 0 ? Math.round((w / total) * 100) : 0;
                          return (
                            <tr key={char.id.toString()} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-1.5 pr-2 text-gray-400">{i + 1}</td>
                              <td className="py-1.5 pr-2 flex items-center gap-1.5">
                                <img
                                  src={`/characters/${Number(char.id) + 1}.png`}
                                  alt={char.name}
                                  className="w-5 h-5 rounded object-contain bg-gray-800"
                                  onError={(e) => { e.target.style.display = "none" }}
                                />
                                <span className="text-white font-medium truncate max-w-[70px]">{char.name}</span>
                              </td>
                              <td className="py-1.5 pr-2 text-white/80 truncate max-w-[110px]">{char.anime}</td>
                              <td className="text-center py-1.5 pr-2 text-[#22ff88]">{char.power}</td>
                              <td className="text-center py-1.5 pr-2 text-[#22ff88]">{w}</td>
                              <td className="text-center py-1.5 pr-2 text-red-400">{l}</td>
                              <td className={`text-center py-1.5 font-semibold ${total > 0 ? (pct >= 50 ? "text-[#22ff88]" : "text-red-400") : "text-white/60"}`}>{total > 0 ? `${pct}%` : "-"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                ) : (
                <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
                  {allPlayers.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">No players yet</p>
                  ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#22ff88] border-b border-white/10">
                        <th className="text-left py-2 pr-2 font-semibold">#</th>
                        <th className="text-left py-2 pr-2 font-semibold">Address</th>
                        <th className="text-center py-2 pr-2 font-semibold">W</th>
                        <th className="text-center py-2 pr-2 font-semibold">L</th>
                        <th className="text-center py-2 font-semibold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...allPlayers]
                        .sort((a, b) => {
                          const wa = Number(b.wins ?? 0) - Number(a.wins ?? 0);
                          if (wa !== 0) return wa;
                          const ta = Number(a.wins) + Number(a.losses);
                          const tb = Number(b.wins) + Number(b.losses);
                          return tb - ta;
                        })
                        .map((entry, i) => {
                          const w = Number(entry.wins);
                          const l = Number(entry.losses);
                          const total = w + l;
                          const pct = total > 0 ? Math.round((w / total) * 100) : 0;
                          const isYou = isConnected && entry.player?.toLowerCase() === address?.toLowerCase();
                          return (
                            <tr key={entry.player} className={`${isYou ? "bg-[#22ff88]/10 border-b border-[#22ff88]/30" : "border-b border-white/5 hover:bg-white/5"} transition-colors`}>
                              <td className="py-1.5 pr-2 text-gray-400">{i + 1}</td>
                              <td className="py-1.5 pr-2 flex items-center gap-1.5">
                                <span className={`${isYou ? "text-[#22ff88]" : "text-white"} font-mono text-[11px]`}>
                                  {entry.player?.substring(0, 6)}...{entry.player?.substring(38)}
                                </span>
                                {isYou && <span className="text-[10px] text-[#22ff88] font-semibold">(you)</span>}
                              </td>
                              <td className="text-center py-1.5 pr-2 text-[#22ff88]">{w}</td>
                              <td className="text-center py-1.5 pr-2 text-red-400">{l}</td>
                              <td className={`text-center py-1.5 font-semibold ${total > 0 ? (pct >= 50 ? "text-[#22ff88]" : "text-red-400") : "text-white/60"}`}>{total > 0 ? `${pct}%` : "-"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  )}
                </div>
                )}
              </div>
            ) : (
              <div>
                {!isConnected ? (
                  <p className="text-center text-gray-400 text-sm py-8">Connect wallet to see your battle history</p>
                ) : historyLoading ? (
                  <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
                ) : battleHistory.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No battles yet. Go fight!</p>
                ) : (
                  <div>
                    {playerStats && (
                      <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 text-xs">
                        <span className="text-gray-400">Your Record</span>
                        <span className="text-[#22ff88] font-semibold">{Number(playerStats.wins ?? 0)}W</span>
                        <span className="text-red-400 font-semibold">{Number(playerStats.losses ?? 0)}L</span>
                        <span className="text-gray-500">|</span>
                        {(() => {
                          const total = Number(playerStats.wins) + Number(playerStats.losses);
                          const pct = total > 0 ? Math.round((Number(playerStats.wins) / total) * 100) : 0;
                          return (
                        <span className={total > 0 ? (pct >= 50 ? "text-[#22ff88]" : "text-red-400") : "text-gray-500"}>
                          {total > 0 ? `${pct}%` : "-"}
                        </span>
                          );
                        })()}
                      </div>
                    )}
                    <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[#22ff88] border-b border-white/10">
                            <th className="text-left py-2 pr-2 font-semibold">#</th>
                            <th className="text-left py-2 pr-2 font-semibold">You</th>
                            <th className="text-left py-2 pr-2 font-semibold">Opponent</th>
                            <th className="text-center py-2 font-semibold">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...battleHistory].reverse().map((rec, i) => {
                            const pChar = characters.find((c) => Number(c.id) === Number(rec.playerCharId));
                            const oChar = characters.find((c) => Number(c.id) === Number(rec.opponentCharId));
                            const won = Number(rec.winnerId) === Number(rec.playerCharId);
                            return (
                              <tr key={rec.id?.toString() || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-1.5 pr-2 text-gray-400">{Number(rec.id)}</td>
                                <td className="py-1.5 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <img src={`/characters/${Number(rec.playerCharId) + 1}.png`} alt="" className="w-5 h-5 rounded object-contain bg-gray-800 shrink-0" onError={(e) => { e.target.style.display = "none" }} />
                                    <div className="min-w-0">
                                      <div className="text-white text-[11px] leading-tight truncate max-w-[60px]">{pChar?.name || "?"}</div>
                                      <div className="text-white/50 text-[9px] leading-tight truncate max-w-[60px]">{pChar?.anime || ""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-1.5 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <img src={`/characters/${Number(rec.opponentCharId) + 1}.png`} alt="" className="w-5 h-5 rounded object-contain bg-gray-800 shrink-0" onError={(e) => { e.target.style.display = "none" }} />
                                    <div className="min-w-0">
                                      <div className="text-white text-[11px] leading-tight truncate max-w-[60px]">{oChar?.name || "?"}</div>
                                      <div className="text-white/50 text-[9px] leading-tight truncate max-w-[60px]">{oChar?.anime || ""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center py-1.5">
                                  <div className={`font-bold text-[13px] ${won ? "text-[#22ff88]" : "text-red-400"}`}>
                                    {won ? "WIN" : "LOSS"}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
    <div className="fixed bottom-4 left-0 right-0 text-center z-30">
      <p className="text-xs md:text-base lg:text-lg tracking-[0.15em] text-white/90" style={{ fontFamily: "AngillaTattoo, serif" }}>
        <a href="https://github.com/0z1-ghb" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        <span className="mx-3 text-white/30">/</span>
        <a href="https://docs.ritualfoundation.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Doc</a>
        <span className="mx-3 text-white/30">/</span>
        <span>built by</span>{" "}
        <a href="https://x.com/0z1_x" target="_blank" rel="noopener noreferrer" className="text-[#22ff88] hover:text-white transition-colors tracking-widest">
          O Z I
        </a>
      </p>
    </div>
    </>
  );
}
