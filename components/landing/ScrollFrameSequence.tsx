"use client";
import { useRef, useEffect, useState, ReactNode } from "react";

const TOTAL_FRAMES = 106;

function getFrameSrc(i: number) {
  return `/frames/frame-${String(i).padStart(3, "0")}.jpg`;
}

export function ScrollFrameSequence({ children }: { children: ReactNode }) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [ready, setReady] = useState(false);
  const frameCacheRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let loaded = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        loaded++;
        if (loaded === TOTAL_FRAMES) setReady(true);
      };
      frameCacheRef.current[i - 1] = img;
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev >= TOTAL_FRAMES ? 1 : prev + 1));
    }, 60);
    return () => clearInterval(timer);
  }, [ready]);

  if (!ready) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--rose)" }}>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div
      style={{ height: "100vh", position: "relative", overflow: "hidden" }}
      aria-hidden="true"
    >
      <div className="hero-scroll-pin" style={{ position: "absolute", inset: 0 }}>
        <img
          src={getFrameSrc(currentFrame)}
          alt="Memorial animation"
          className="hero-scroll-bg"
        />
        <div className="hero-scroll-overlay" />
        <div className="hero-scroll-dissolve" />
        <div className="hero-scroll-content">
          {children}
        </div>
      </div>
    </div>
  );
}