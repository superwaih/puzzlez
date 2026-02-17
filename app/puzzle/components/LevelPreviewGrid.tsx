import Image from "next/image";
import type { PuzzleLevel } from "../types";

type LevelPreviewGridProps = {
  levels: readonly PuzzleLevel[];
  currentLevelIndex: number;
  maxUnlockedLevel: number;
  completedLevels: number[];
  onSelectLevel: (index: number) => void;
  keyPrefix: string;
  cardImageClassName?: string;
};

export function LevelPreviewGrid({
  levels,
  currentLevelIndex,
  maxUnlockedLevel,
  completedLevels,
  onSelectLevel,
  keyPrefix,
  cardImageClassName = "h-20 w-full object-cover",
}: LevelPreviewGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {levels.map((level, idx) => {
        const isUnlocked = idx <= maxUnlockedLevel;
        const isActive = idx === currentLevelIndex;
        const isCompleted = completedLevels.includes(idx);

        return (
          <button
            key={`${keyPrefix}-${level.label}`}
            type="button"
            onClick={() => onSelectLevel(idx)}
            disabled={!isUnlocked}
            className={`relative overflow-hidden rounded-lg border p-0 text-left transition ${
              isActive ? "border-yellow-300/70" : "border-white/20"
            } ${isUnlocked ? "cursor-pointer" : "cursor-not-allowed opacity-65"}`}
            aria-label={`${level.label}${isUnlocked ? "" : " locked"}`}
          >
            <Image src={level.image} alt={level.label} width={400} height={520} className={cardImageClassName} />
            <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-[11px] text-white/90 flex items-center justify-between">
              <span>{level.label}</span>
              <span>{isUnlocked ? (isCompleted ? "Done" : "Open") : "Locked"}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
