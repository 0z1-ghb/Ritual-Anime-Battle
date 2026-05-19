"use client";
import { useState, useEffect, useRef } from "react";

const LEAF_COLORS = ["#10b981", "#34d399", "#059669", "#6ee7b7", "#047857"];

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef(null);

  useEffect(() => {
    const w = window.innerWidth;
    const leafList = [];
    for (let i = 0; i < 60; i++) {
      leafList.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 300,
        size: 14 + Math.random() * 14,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 4,
        speed: 0.3 + Math.random() * 0.5,
        swayAmp: 0.1 + Math.random() * 0.2,
        swayFreq: 0.02 + Math.random() * 0.02,
        opacity: 0.3 + Math.random() * 0.4,
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        windX: (Math.random() - 0.5) * 0.2,
        time: Math.random() * 100,
      });
    }
    setLeaves(leafList);

    const handleMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);

    let running = true;
    let lastTime = performance.now();

    const tick = (now) => {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 16, 3);
      lastTime = now;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      setLeaves((prev) =>
        prev.map((l) => {
          const dx = l.x - mx;
          const dy = l.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let wind = l.windX;
          if (dist < 500) {
            const force = (1 - dist / 500) * 0.8;
            wind += (dx / (dist || 1)) * force * 0.1;
          }
          const t = l.time + dt * l.swayFreq;
          let { x, y } = l;
          x += wind * dt + Math.sin(t) * l.swayAmp;
          y += l.speed * dt;
          const h = window.innerHeight;
          if (y > h + 40) { y = -40 - Math.random() * 100; x = Math.random() * window.innerWidth; }
          if (x < -60) x = window.innerWidth + 20;
          if (x > window.innerWidth + 60) x = -20;
          return {
            ...l,
            x, y,
            rot: l.rot + l.rotSpeed * dt,
            windX: wind * 0.92,
            time: t,
          };
        })
      );
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.removeEventListener("mousemove", handleMove);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      {leaves.map((leaf, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            width: `${leaf.size}px`,
            height: `${leaf.size * 0.55}px`,
            left: `${leaf.x}px`,
            top: `${leaf.y}px`,
            transform: `rotate(${leaf.rot}deg)`,
            opacity: leaf.opacity,
            borderRadius: "2px 60% 2px 60%",
            background: leaf.color,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}
