"use client";
import { useState, useEffect, useRef } from "react";

export default function LoadingScreen({ isLoading, onLoaded }) {
  const [phase, setPhase] = useState(0);
  const [dot, setDot] = useState(0);
  const [splitState, setSplitState] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 2000);
    const t4 = setTimeout(() => { setPhase(4); setSplitState(1); }, 2800);
    const t4b = setTimeout(() => setSplitState(2), 3300);
    const t5 = setTimeout(() => { setPhase(5); onLoaded?.(); }, 4000);
    const dotInt = setInterval(() => setDot((d) => (d + 1) % 3), 500);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t4b); clearTimeout(t5); clearInterval(dotInt);
    };
  }, [isLoading, onLoaded]);

  const visible = isLoading && phase < 5;
  const sharedBg = "radial-gradient(ellipse at center, #041a12 0%, #030d08 40%, #000000 100%)";
  const lineActive = splitState >= 1;
  const splitActive = splitState >= 2;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: sharedBg,
          clipPath: splitActive ? "inset(0 50% 0 0)" : "inset(0)",
          transform: splitActive ? "translateX(-50%)" : "translateX(0)",
          transition: splitActive
            ? "clip-path 0s, transform 0.6s cubic-bezier(0.7, 0, 0.3, 1)"
            : "none",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: sharedBg,
          clipPath: splitActive ? "inset(0 0 0 50%)" : "inset(0)",
          transform: splitActive ? "translateX(50%)" : "translateX(0)",
          transition: splitActive
            ? "clip-path 0s, transform 0.6s cubic-bezier(0.7, 0, 0.3, 1)"
            : "none",
        }}
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: "3px",
          height: "100%",
          background: "#10b981",
          transformOrigin: "center",
          transform: lineActive ? "scaleY(1)" : "scaleY(0)",
          transition: lineActive
            ? "transform 0.5s cubic-bezier(0.15, 0.1, 0.2, 1), opacity 0.3s ease-out"
            : "none",
          boxShadow: lineActive
            ? "0 0 8px #10b981, 0 0 25px #10b981, 0 0 50px rgba(16,185,129,0.4)"
            : "none",
          opacity: splitActive ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          opacity: splitActive ? 0 : 1,
          transition: splitActive ? "opacity 0.3s ease-out" : "none",
        }}
      >
        <div className="relative flex items-center justify-center w-40 h-40">
          <svg width="160" height="160" viewBox="0 0 160 160" className="absolute">
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              style={{
                strokeDasharray: 427,
                strokeDashoffset: phase >= 1 ? 0 : 427,
                opacity: phase >= 1 ? 1 : 0,
                transition: phase >= 1
                  ? "stroke-dashoffset 1.7s ease-in-out, opacity 0.01s linear"
                  : "none",
              }}
            />
          </svg>
          <div
            className="absolute w-full h-full flex items-center justify-center"
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transition: "opacity 0.01s linear",
            }}
          >
            <img
              src="/ritual-logo.png"
              alt="Ritual"
              className="w-28 h-28 object-contain"
              style={{
                transition: "clip-path 1.7s ease-in-out",
                clipPath: phase >= 1
                  ? "circle(50% at center)"
                  : "circle(0% at center)",
              }}
            />
          </div>
        </div>
        <p
          className="mt-1 text-5xl"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.6s ease-out",
            color: "#ffffff",
            fontFamily: "AngillaTattoo, serif",
            textShadow: "0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)",
          }}
        >
          Ritual
        </p>
        <p
          className="mt-1 text-sm tracking-widest"
          style={{
            opacity: phase >= 3 ? 0.35 : 0,
            transform: phase >= 3 ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.6s ease-out",
            color: "#ffffff",
          }}
        >
          ANIME BATTLE ARENA
        </p>
        <div className="mt-4 flex items-center gap-1.5" style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.4s ease-out" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: "#10b981",
                opacity: dot === i ? 1 : 0.08,
                boxShadow: dot === i ? "0 0 6px #10b981" : "none",
                transition: "all 0.5s ease-in-out",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
