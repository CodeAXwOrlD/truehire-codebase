"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor v2 — soft blurred glow trail (teal-tinted) + a crisp center
 * dot. The glow eases toward the pointer position (lag), the dot tracks
 * exactly. Scales and brightens over interactive elements. Real cursor
 * movement only — no ambient/looping motion (Design.md §5.1).
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setIsFinePointer(mq.matches);
    if (!mq.matches) return;

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest("a, button, input, [role='button'], .cursor-interactive")));
    }

    let rafId: number;
    function tick() {
      glowX += (mouseX - glowX) * 0.12;
      glowY += (mouseY - glowY) * 0.12;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", handleMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isFinePointer) return null;

  const glowSize = hovering ? 140 : 90;

  return (
    <>
      {/* Soft blurred glow — the main visual element */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,opacity] duration-300 ease-out"
        style={{
          width: glowSize,
          height: glowSize,
          background: hovering
            ? "radial-gradient(circle, rgba(47,191,168,0.22) 0%, rgba(47,191,168,0.08) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 45%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Crisp center dot — tracks exactly, no lag */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-200 ease-out"
        style={{
          width: hovering ? 8 : 6,
          height: hovering ? 8 : 6,
          backgroundColor: hovering ? "#2FBFA8" : "#F2F2F3",
          boxShadow: hovering ? "0 0 8px rgba(47,191,168,0.6)" : "0 0 4px rgba(255,255,255,0.3)",
        }}
      />
    </>
  );
}
