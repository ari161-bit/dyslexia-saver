import confetti from "canvas-confetti";

const BRAND_COLORS = ["#D9713F", "#F2A65A", "#4A7C59", "#fdfaf6"];

// A short, tasteful burst for "I finished something" moments — submitting
// work, earning a badge — not a full-screen takeover. Skipped for anyone
// who has asked their OS/browser to reduce motion.
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const defaults = { colors: BRAND_COLORS, disableForReducedMotion: true, zIndex: 200 };
  confetti({ ...defaults, particleCount: 60, spread: 65, startVelocity: 45, origin: { x: 0.5, y: 0.7 } });
  confetti({ ...defaults, particleCount: 40, spread: 100, startVelocity: 35, origin: { x: 0.3, y: 0.75 }, angle: 60 });
  confetti({ ...defaults, particleCount: 40, spread: 100, startVelocity: 35, origin: { x: 0.7, y: 0.75 }, angle: 120 });
}
