import { useCallback, useEffect, useMemo, useState } from "react";
import { LEVEL_STORAGE_KEYS } from "../constants";
import type { PuzzleLevel } from "../types";

function readStoredNumber(key: string, fallback: number, maxIndex: number) {
  if (typeof window === "undefined") return fallback;
  const saved = Number(localStorage.getItem(key) ?? fallback);
  if (!Number.isInteger(saved)) return fallback;
  if (saved < 0 || saved > maxIndex) return fallback;
  return saved;
}

function readStoredCompleted(maxIndex: number) {
  if (typeof window === "undefined") return [] as number[];
  const saved = localStorage.getItem(LEVEL_STORAGE_KEYS.completed);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as number[];
    return parsed.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx <= maxIndex);
  } catch {
    return [];
  }
}

export function useLevelProgress(levels: readonly PuzzleLevel[]) {
  const maxIndex = levels.length - 1;

  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(() =>
    readStoredNumber(LEVEL_STORAGE_KEYS.current, 0, maxIndex),
  );

  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() =>
    readStoredNumber(LEVEL_STORAGE_KEYS.maxUnlocked, 0, maxIndex),
  );

  const [completedLevels, setCompletedLevels] = useState<number[]>(() =>
    readStoredCompleted(maxIndex),
  );

  useEffect(() => {
    localStorage.setItem(LEVEL_STORAGE_KEYS.current, String(currentLevelIndex));
  }, [currentLevelIndex]);

  useEffect(() => {
    localStorage.setItem(LEVEL_STORAGE_KEYS.maxUnlocked, String(maxUnlockedLevel));
  }, [maxUnlockedLevel]);

  useEffect(() => {
    localStorage.setItem(LEVEL_STORAGE_KEYS.completed, JSON.stringify(completedLevels));
  }, [completedLevels]);

  useEffect(() => {
    if (currentLevelIndex > maxUnlockedLevel) {
      setCurrentLevelIndex(maxUnlockedLevel);
    }
  }, [currentLevelIndex, maxUnlockedLevel]);

  const currentLevel = useMemo(() => levels[currentLevelIndex], [currentLevelIndex, levels]);

  const markLevelCompleted = useCallback((levelIndex: number) => {
    setCompletedLevels((prev) => (prev.includes(levelIndex) ? prev : [...prev, levelIndex]));
    setMaxUnlockedLevel((prev) => Math.max(prev, Math.min(levelIndex + 1, maxIndex)));
  }, [maxIndex]);

  const selectLevel = useCallback((levelIndex: number) => {
    if (levelIndex > maxUnlockedLevel) return false;
    setCurrentLevelIndex(levelIndex);
    return true;
  }, [maxUnlockedLevel]);

  const hasNextLevel = currentLevelIndex < maxIndex;

  const goToNextLevel = useCallback(() => {
    if (!hasNextLevel) return false;
    setCurrentLevelIndex((prev) => Math.min(prev + 1, maxIndex));
    return true;
  }, [hasNextLevel, maxIndex]);

  return {
    currentLevel,
    currentLevelIndex,
    maxUnlockedLevel,
    completedLevels,
    hasNextLevel,
    setCurrentLevelIndex,
    selectLevel,
    markLevelCompleted,
    goToNextLevel,
  };
}
