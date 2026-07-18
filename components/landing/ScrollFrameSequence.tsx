"use client";
import { useRef, useEffect, useState, ReactNode } from "react";

const TOTAL_FRAMES = 106;
const PLAYBACK_FPS = 18; // Cinematic frame rate for smooth autoplay (adjust to speed up/slow down)

function getFrameSrc(i: number) {
  return `/frames/frame-${String(i).padStart(3, "0")}.jpg`;
}

export function ScrollFrameSequence({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef<number | null>(null);

  const [loaded, setLoaded] = useState(false);
  const frameCacheRef = useRef<HTMLImageElement[]>([]);

  // ── Preload all frames to prevent flickering ─────────────────────────────
  useEffect(() => {
    let loadedCount = 0;

    // Load first image first to unlock display quickly
    const firstImg = new Image();
    firstImg.src = getFrameSrc(1);
    firstImg.onload = () => {
      frameCacheRef.current[0] = firstImg;
      loadedCount++;
      // Preload the rest asynchronously
      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameSrc(i);
        img.onload = () => {
          loadedCount++;
          if (loadedCount === TOTAL_FRAMES) {
            setLoaded(true);
          }
        };
        frameCacheRef.current[i - 1] = img;
      }
      
      // In case some images fail to notify or load instantly
      setTimeout(() => {
        setLoaded(true);
      }, 1500);
    };
  }, []);

  // ── Frame autoplay cycle loop ───────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;

    let lastTime = performance.now();
    const interval = 1000 / PLAYBACK_FPS;
    let currentFrame = 1;
    let active = true;

    const tick = (now: number) => {
      if (!active) return;

      const elapsed = now - lastTime;

      // When the elapsed time surpasses our target frame interval, advance the frame
      if (elapsed >= interval) {
        currentFrame = (currentFrame % TOTAL_FRAMES) + 1;
        
        if (imgRef.current) {
          imgRef.current.src = getFrameSrc(currentFrame);
        }
        
        // Adjust lastTime to handle slight rendering lag smoothly
        lastTime = now - (elapsed % interval);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [loaded]);

  if (!loaded) {
    return (
      <div style={{ height: "100vh" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--rose)",
          }}
        >
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading memorial background…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      style={{ height: "100vh", position: "relative" }}
    >
      <div className="hero-scroll-pin" style={{ position: "relative" }}>
        {/* Autoplay animated background image */}
        <img
          ref={imgRef}
          src={getFrameSrc(1)}
          alt=""
          aria-hidden="true"
          className="hero-scroll-bg"
        />

        {/* Colour overlay + vignette */}
        <div className="hero-scroll-overlay" />

        {/* Bottom dissolve — fades the background into the timeline section */}
        <div className="hero-scroll-dissolve" />

        {/* Hero content identity */}
        <div className="hero-scroll-content">{children}</div>
      </div>
    </div>
  );
}