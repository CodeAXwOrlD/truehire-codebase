"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isText, setIsText] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    setMounted(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let isVisible = false;

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isVisible = true;

      if (dotRef.current) {
        dotRef.current.style.opacity = "1";
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive = Boolean(
        target.closest("a, button, [role='button'], select, .cursor-pointer, .hover-interactive")
      );
      const isInput = Boolean(
        target.closest("input, textarea, [contenteditable='true']")
      );

      setHovering(isInteractive);
      setIsText(isInput);
    }

    function handleMouseDown() {
      setClicking(true);
    }

    function handleMouseUp() {
      setClicking(false);
    }

    function handleMouseLeave() {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    }

    function handleMouseEnter() {
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = "1";
    }

    let rafId: number;
    function render() {
      // Smooth lerp physics for trailing ring
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(render);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden">
      {/* Outer Smooth Trailing Halo Ring */}
      <div
        ref={ringRef}
        className="fixed left-0 top-0 will-change-transform opacity-0 transition-[width,height,border-color,background-color,border-radius] duration-200 ease-out"
        style={{
          width: hovering ? 44 : isText ? 4 : 28,
          height: hovering ? 44 : isText ? 24 : 28,
          borderRadius: isText ? "2px" : "50%",
          borderWidth: isText ? "0px" : "1.5px",
          borderStyle: "solid",
          borderColor: hovering ? "#2FBFA8" : "rgba(255, 255, 255, 0.45)",
          backgroundColor: hovering
            ? "rgba(47, 191, 168, 0.12)"
            : isText
            ? "#2FBFA8"
            : "rgba(255, 255, 255, 0.03)",
          boxShadow: hovering
            ? "0 0 16px rgba(47, 191, 168, 0.35)"
            : isText
            ? "0 0 8px rgba(47, 191, 168, 0.6)"
            : "0 0 8px rgba(255, 255, 255, 0.1)",
          transform: clicking ? "scale(0.85)" : "scale(1)",
        }}
      />

      {/* Inner Precision Beacon Dot */}
      <div
        ref={dotRef}
        className="fixed left-0 top-0 will-change-transform opacity-0 rounded-full transition-[width,height,background-color] duration-150 ease-out"
        style={{
          width: hovering ? 8 : isText ? 0 : 6,
          height: hovering ? 8 : isText ? 0 : 6,
          backgroundColor: hovering ? "#2FBFA8" : "#FFFFFF",
          boxShadow: hovering
            ? "0 0 10px #2FBFA8"
            : "0 0 6px rgba(255, 255, 255, 0.8)",
          transform: clicking ? "scale(1.4)" : "scale(1)",
        }}
      />
    </div>
  );
}
