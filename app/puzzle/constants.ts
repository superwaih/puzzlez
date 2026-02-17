import type { PuzzleLevel } from "./types";

export const EMPTY_SLOT = -1;

export const LEVEL_STORAGE_KEYS = {
  current: "puzzle-current-level",
  maxUnlocked: "puzzle-max-unlocked-level",
  completed: "puzzle-completed-levels",
} as const;

export const BANKS = [
  "Access Bank",
  "GTBank",
  "First Bank of Nigeria",
  "Zenith Bank",
  "UBA",
  "Fidelity Bank",
  "Sterling Bank",
  "Union Bank",
  "Wema Bank",
  "Opay",
  "Kuda",
  "PalmPay",
] as const;

export const HOME_LEVELS: readonly PuzzleLevel[] = [
  { label: "Level 1", image: "/ben-new.jpeg", rows: 3, cols: 3 },
  { label: "Level 2", image: "/levels/level-3.jpeg", rows: 3, cols: 3 },
  { label: "Level 3", image: "/levels/level-4.jpeg", rows: 3, cols: 4 },
  { label: "Level 4", image: "/levels/level-5.jpeg", rows: 3, cols: 4 },
  { label: "Level 5", image: "/levels/level-6.jpeg", rows: 4, cols: 4 },
  { label: "Level 6", image: "/levels/level-7.jpeg", rows: 4, cols: 5 },
  { label: "Level 7", image: "/levels/level-8.jpeg", rows: 4, cols: 4 },
];

export const GAME_LEVELS: readonly PuzzleLevel[] = [
  { label: "Level 1", image: "/levels/level-2.jpeg", rows: 3, cols: 4 },
  { label: "Level 2", image: "/levels/level-3.jpeg", rows: 3, cols: 4 },
  { label: "Level 3", image: "/levels/level-4.jpeg", rows: 4, cols: 4 },
  { label: "Level 4", image: "/levels/level-5.jpeg", rows: 4, cols: 5 },
  { label: "Level 5", image: "/levels/level-6.jpeg", rows: 4, cols: 5 },
  { label: "Level 6", image: "/levels/level-7.jpeg", rows: 5, cols: 5 },
  { label: "Level 7", image: "/levels/level-8.jpeg", rows: 5, cols: 6 },
];
