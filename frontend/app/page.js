"use client";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { parseGwei } from "viem";
import { decodeEventLog } from "viem";
import { injected } from "wagmi/connectors";
import { readContract, writeContract, watchContractEvent, waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../lib/useWagmiConfig";
import { CONTRACT_ADDRESS, CONTRACT_ABI, RITUAL_CHAIN } from "../lib/config";
import CharacterCard from "../components/CharacterCard";
import LoadingScreen from "../components/LoadingScreen";
import Leaves from "../components/Leaves";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
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

  useEffect(() => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x" + "0".repeat(40)) return;
    const unwatch = watchContractEvent(config, {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      eventName: "BattleResult",
      onLogs(logs) {
        fetchCharacters();
      },
    });
    return () => unwatch();
  }, []);

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
      <div className="fixed left-6 text-center" style={{ zIndex: 20, top: "24px" }}>
        <h1 className="text-8xl tracking-wide" style={{
          fontFamily: "AngillaTattoo, serif",
          color: "#22ff88",
          textShadow: "0 0 10px rgba(34,255,136,0.6), 0 0 40px rgba(34,255,136,0.3)",
          opacity: isLoading ? 0 : 1,
          transform: isLoading ? "translateY(20px)" : "translateY(0)",
          transition: isLoading ? "none" : "all 1.8s ease-out",
        }}>
          Anime Battle Arena
        </h1>
        <p className="text-3xl tracking-widest" style={{
          fontFamily: "AngillaTattoo, serif",
          color: "#ffffff",
          opacity: isLoading ? 0 : 0.8,
          transform: isLoading ? "translateY(12px)" : "translateY(0)",
          transition: isLoading ? "none" : "all 1.8s ease-out 0.4s",
        }}>
          ON-CHAIN BATTLE ARENA
        </p>
      </div>
      <main className="fixed left-6 bottom-6 w-4/5 max-w-4xl pt-10 p-6 overflow-y-auto backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-xl hide-scrollbar relative" style={{ top: "170px" }}>
        {isMounted && isConnected && (
          <button
            onClick={() => disconnect()}
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
            <p className="text-white/90 mb-5 text-xl font-semibold tracking-wide text-center" style={{ fontFamily: "AngillaTattoo, serif" }}>
              battle your favorite anime characters on-chain
            </p>
            <button
              onClick={() => connect({ connector: injected() })}
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
        )}
      </main>
    </div>
    <div className="fixed bottom-4 left-0 right-0 text-center z-30">
      <p className="text-lg tracking-[0.15em] text-white/90" style={{ fontFamily: "AngillaTattoo, serif" }}>
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
