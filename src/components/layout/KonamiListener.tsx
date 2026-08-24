"use client";

import { useEffect, useState } from "react";
import { usePreferencesStore } from "@/lib/store/preferencesStore";
import { EasterEggModal } from "@/components/forensic/EasterEggModal";
import { DeterministicEasterEgg } from "@/types/domain";
import confetti from "canvas-confetti";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const KONAMI_EGG: DeterministicEasterEgg = {
  id: "egg-konami",
  title: "CLASSIFIED: KONAMI OVERRIDE UNLOCKED",
  trigger: "Entered retro Konami sequence (↑ ↑ ↓ ↓ ← → ← → B A)",
  unlockedAt: new Date().toISOString(),
  dialogue: "Forbidden developer mode unlocked. 30 extra lives credited to your git commit ledger.",
};

export function KonamiListener() {
  const { unlockForbiddenMode } = usePreferencesStore();
  const [keyIndex, setKeyIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const expectedKey = KONAMI_SEQUENCE[keyIndex];

      if (e.key.toLowerCase() === expectedKey.toLowerCase()) {
        const nextIndex = keyIndex + 1;
        if (nextIndex === KONAMI_SEQUENCE.length) {
          unlockForbiddenMode();
          setShowModal(true);
          setKeyIndex(0);
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
          });
        } else {
          setKeyIndex(nextIndex);
        }
      } else {
        setKeyIndex(0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyIndex, unlockForbiddenMode]);

  return (
    <EasterEggModal
      egg={KONAMI_EGG}
      isOpen={showModal}
      onClose={() => setShowModal(false)}
    />
  );
}
