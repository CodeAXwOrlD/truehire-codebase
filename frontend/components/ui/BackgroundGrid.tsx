"use client";

/**
 * Linear/Vercel-style background treatment — inspired by the "Grid Pattern"
 * family of components common on 21st.dev/Magic UI, adapted to be fully
 * static and monochrome per Design.md §5 (no ambient/looping motion, no
 * off-brand color). Soft teal glow only at the very top (brand accent,
 * used sparingly per Design.md §2), fading into a hairline grid, fading
 * to pure black by mid-page.
 */
export function BackgroundGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      {/* Soft brand-accent glow, top-center only — the one place color is allowed to breathe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(47,191,168,0.14), transparent 70%)",
        }}
      />

      {/* Hairline grid — same border color/weight as cards, just extended to the canvas */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 20%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 20%, black 40%, transparent 90%)",
        }}
      />

      {/* Fade to solid black by mid-page so content further down stays clean */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent 0%, transparent 60%, #0A0A0B 100%)" }}
      />
    </div>
  );
}
