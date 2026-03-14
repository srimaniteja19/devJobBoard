/** Trigger confetti for milestones (applied count). Only runs in browser. */
export function fireConfetti() {
  if (typeof window === "undefined") return;
  import("canvas-confetti").then((confetti) => {
    confetti.default({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  });
}
