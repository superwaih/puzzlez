"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LevelPreviewGrid } from "../puzzle/components/LevelPreviewGrid";
import { PuzzleTile } from "../puzzle/components/PuzzleTile";
import { WinModal } from "../puzzle/components/WinModal";
import { WithdrawModal } from "../puzzle/components/WithdrawModal";
import { BANKS, EMPTY_SLOT, GAME_LEVELS } from "../puzzle/constants";
import { useLevelProgress } from "../puzzle/hooks/useLevelProgress";
import {
  createShuffledBoard,
  createSolvedBoard,
  formatNaira,
  formatTime,
  generateMathChallenge,
  getNeighbors,
  isBoardSolved,
} from "../puzzle/utils";

export default function GamesPage() {
  const {
    currentLevel,
    currentLevelIndex,
    maxUnlockedLevel,
    completedLevels,
    hasNextLevel,
    selectLevel,
    markLevelCompleted,
    goToNextLevel,
  } = useLevelProgress(GAME_LEVELS);
  const [board, setBoard] = useState<number[]>(() => createSolvedBoard(GAME_LEVELS[0].rows, GAME_LEVELS[0].cols));
  const [mounted, setMounted] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [balance, setBalance] = useState(50000000);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [winTime, setWinTime] = useState(0);
  const [isAdvancingLevel, setIsAdvancingLevel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mathInput, setMathInput] = useState("");
  const [mathQuestion, setMathQuestion] = useState("");
  const [mathAnswer, setMathAnswer] = useState<number>(0);
  const [withdrawDone, setWithdrawDone] = useState(false);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    setPaused(false);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setBoard(createShuffledBoard(currentLevel.rows, currentLevel.cols));
    setShowWinModal(false);
    setIsAdvancingLevel(false);
    setMounted(true);
    startTimer();
    return () => stopTimer();
  }, [currentLevel, startTimer, stopTimer]);

  useEffect(() => {
    if (paused || showWinModal) {
      stopTimer();
    } else if (mounted && !paused && !showWinModal) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => stopTimer();
  }, [paused, showWinModal, mounted, stopTimer]);

  const emptyIndex = useMemo(() => board.indexOf(EMPTY_SLOT), [board]);
  const solved = useMemo(() => isBoardSolved(board), [board]);

  useEffect(() => {
    if (solved && mounted && !showWinModal && !isAdvancingLevel) {
      setWinTime(elapsed);
      setShowWinModal(true);
      markLevelCompleted(currentLevelIndex);
    }
  }, [solved, mounted, elapsed, showWinModal, currentLevelIndex, isAdvancingLevel, markLevelCompleted]);

  const moveTile = (tileIndex: number) => {
    if (tileIndex < 0 || tileIndex >= board.length) return;
    if (board[tileIndex] === EMPTY_SLOT) return;

    const canMove = getNeighbors(emptyIndex, currentLevel.rows, currentLevel.cols).includes(tileIndex);
    if (!canMove) return;

    setBoard((prev) => {
      const next = [...prev];
      const nextEmpty = next.indexOf(EMPTY_SLOT);
      [next[nextEmpty], next[tileIndex]] = [next[tileIndex], next[nextEmpty]];
      return next;
    });
  };

  const handleTileDragStart = (event: React.DragEvent<HTMLButtonElement>, tileIndex: number) => {
    event.dataTransfer.setData("text/plain", String(tileIndex));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleEmptyDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleEmptyDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rawIndex = event.dataTransfer.getData("text/plain");
    const tileIndex = Number(rawIndex);
    if (!Number.isInteger(tileIndex)) return;
    moveTile(tileIndex);
  };

  const togglePause = () => {
    setPaused((p) => !p);
  };

  const resetGame = () => {
    setBoard(createShuffledBoard(currentLevel.rows, currentLevel.cols));
    setShowWinModal(false);
    startTimer();
  };

  const playNextLevel = () => {
    if (hasNextLevel) {
      setIsAdvancingLevel(true);
      setShowWinModal(false);
      goToNextLevel();
      setPaused(false);
      return;
    }
    setShowWinModal(false);
    resetGame();
  };

  const handleSelectLevel = (levelIndex: number) => {
    const didSelect = selectLevel(levelIndex);
    if (!didSelect) return;
    setPaused(false);
    setShowWinModal(false);
  };

  const openWithdrawModal = () => {
    const challenge = generateMathChallenge();
    setMathQuestion(challenge.question);
    setMathAnswer(challenge.answer);
    setSelectedBank("");
    setAccountNumber("");
    setMathInput("");
    setWithdrawDone(false);
    setWithdrawOpen(true);
  };

  const accountValid = /^[0-9]{10}$/.test(accountNumber);
  const challengePassed = Number(mathInput.trim()) === mathAnswer;
  const canWithdraw = Boolean(selectedBank) && accountValid && challengePassed;

  const handleWithdraw = () => {
    if (!canWithdraw) return;
    setBalance(0);
    setWithdrawDone(true);
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  return (
    <main className="h-dvh overflow-hidden p-4 max-[1060px]:h-auto max-[1060px]:min-h-dvh max-[1060px]:overflow-auto">
      <div className="h-full max-w-[1200px] mx-auto grid grid-cols-[minmax(0,1fr)_320px] gap-3.5 max-[1060px]:h-auto max-[1060px]:grid-cols-1">
        <section className="border border-white/[0.12] rounded-[18px] bg-white/[0.04] min-h-0 grid grid-rows-[auto_1fr] gap-3.5 p-3.5">
          <div className="flex flex-wrap justify-between gap-2.5">
            <h1 className="m-0 text-[clamp(1.3rem,3vw,2rem)] font-medium">Puzzle Game</h1>
            <div className="flex items-center flex-wrap gap-2">
              <div className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3">Balance: {formatNaira(balance)}</div>
              <button className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed" onClick={openWithdrawModal} disabled={balance <= 0}>
                Withdraw Balance
              </button>
              <div className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3">
                {currentLevel.label} ({currentLevel.rows}x{currentLevel.cols})
              </div>
              <div className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3 tabular-nums font-mono text-sm">
                ⏱ {formatTime(elapsed)}
              </div>
              <button className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed" onClick={togglePause}>
                {paused ? "▶ Resume" : "⏸ Pause"}
              </button>
              <button className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed" onClick={resetGame}>Reset</button>
            </div>
          </div>

          <div className="relative min-h-0 rounded-[14px] border border-white/[0.12] bg-black/45 p-2.5 max-[1060px]:min-h-[65dvh]">
            <div className="mb-2 rounded-xl border border-white/[0.12] bg-white/[0.03] p-2">
              <p className="m-0 mb-2 text-white/85 text-sm">Levels</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {GAME_LEVELS.map((level, idx) => {
                  const isUnlocked = idx <= maxUnlockedLevel;
                  const isActive = idx === currentLevelIndex;
                  const isCompleted = completedLevels.includes(idx);

                  return (
                    <button
                      key={`top-${level.label}`}
                      type="button"
                      onClick={() => handleSelectLevel(idx)}
                      disabled={!isUnlocked}
                      className={`relative min-w-[94px] overflow-hidden rounded-lg border p-0 text-left transition ${
                        isActive ? "border-yellow-300/70" : "border-white/20"
                      } ${isUnlocked ? "cursor-pointer" : "cursor-not-allowed opacity-65"}`}
                      aria-label={`${level.label}${isUnlocked ? "" : " locked"}`}
                    >
                      <Image src={level.image} alt={level.label} width={220} height={280} className="h-14 w-full object-cover" />
                      <div className="bg-black/65 px-1.5 py-1 text-[10px] text-white/90 flex items-center justify-between">
                        <span>{level.label}</span>
                        <span>{isUnlocked ? (isCompleted ? "Done" : "Open") : "Locked"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {paused && (
              <div className="absolute inset-0 z-20 rounded-[14px] bg-black/80 backdrop-blur-md grid place-items-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">⏸</div>
                  <p className="text-white/80 text-xl font-medium mb-4">Game Paused</p>
                  <p className="text-white/50 text-sm mb-6">Time: {formatTime(elapsed)}</p>
                  <button
                    className="rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white py-3 px-8 text-base font-medium transition-colors"
                    onClick={togglePause}
                  >
                    ▶ Resume
                  </button>
                </div>
              </div>
            )}
            <div
              className="mx-auto h-full max-h-full w-[min(70vh,100%)] grid gap-1 border border-white/[0.12] rounded-[10px] p-1 bg-black/35 aspect-[3/4]"
              style={{
                gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${currentLevel.rows}, minmax(0, 1fr))`,
              }}
            >
              {board.map((pieceId, idx) => {
                if (pieceId === EMPTY_SLOT) {
                  return (
                    <div
                      key={`slot-${idx}`}
                      className="rounded-lg border border-dashed border-white/35 bg-white/5"
                      onDragOver={handleEmptyDragOver}
                      onDrop={handleEmptyDrop}
                    />
                  );
                }

                const movable = getNeighbors(emptyIndex, currentLevel.rows, currentLevel.cols).includes(idx);

                return (
                  <button
                    key={`tile-${pieceId}`}
                    type="button"
                    onClick={() => moveTile(idx)}
                    draggable={movable}
                    onDragStart={(event) => handleTileDragStart(event, idx)}
                    className={`border-none bg-transparent p-0 w-full h-full rounded-lg ${movable ? "cursor-grab" : "cursor-not-allowed opacity-[0.92]"}`}
                    aria-label={`Move tile ${pieceId + 1}`}
                  >
                    <PuzzleTile pieceId={pieceId} rows={currentLevel.rows} cols={currentLevel.cols} image={currentLevel.image} />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="border border-white/[0.12] rounded-[18px] bg-white/[0.04] min-h-0 grid grid-rows-[auto_1fr_auto] gap-3.5 p-3.5 overflow-hidden">
          <div>
            <p className="m-0 mb-2 text-white/75 text-sm">Preview</p>
            <Image
              src={currentLevel.image}
              alt={`${currentLevel.label} preview`}
              width={1536}
              height={2048}
              className="w-full h-48 object-cover rounded-[10px] border border-white/[0.18]"
              priority
            />
          </div>

          <div className="rounded-xl border border-white/[0.12] bg-white/[0.03] p-2.5 text-white/75 text-[0.88rem] space-y-2 overflow-y-auto">
            <p className="m-0 text-white/85 text-sm">Levels</p>
            <LevelPreviewGrid
              levels={GAME_LEVELS}
              currentLevelIndex={currentLevelIndex}
              maxUnlockedLevel={maxUnlockedLevel}
              completedLevels={completedLevels}
              onSelectLevel={handleSelectLevel}
              keyPrefix="games-sidebar"
            />
          </div>

          <Link href="/" className="underline underline-offset-4 text-white/80 text-sm">Back home</Link>
        </aside>
      </div>

      <WinModal
        isOpen={showWinModal}
        variant="games"
        completedTimeText={formatTime(winTime)}
        hasNextLevel={hasNextLevel}
        rewardText="You just unlocked ₦50,000,000"
        onPrimaryAction={playNextLevel}
        onSecondaryAction={() => setShowWinModal(false)}
        secondaryLabel="Celebrate Later"
        previewImageSrc={currentLevel.image}
        previewImageAlt={`${currentLevel.label} complete preview`}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        variant="games"
        title="Withdraw Balance"
        subtitle="Complete all steps correctly to proceed."
        showAvailableBalance={false}
        balanceText={formatNaira(balance)}
        banks={BANKS}
        selectedBank={selectedBank}
        onSelectedBankChange={setSelectedBank}
        accountNumber={accountNumber}
        onAccountNumberChange={handleAccountNumberChange}
        accountPlaceholder="10-digit account number"
        accountValid={accountValid}
        mathQuestion={mathQuestion}
        mathInput={mathInput}
        onMathInputChange={setMathInput}
        challengePassed={challengePassed}
        withdrawDone={withdrawDone}
        doneMessage={`Transfer submitted to ${selectedBank}. Balance is now ${formatNaira(balance)}.`}
        canWithdraw={canWithdraw}
        onClose={() => setWithdrawOpen(false)}
        onSubmit={handleWithdraw}
        closeLabel="Close"
        submitLabel="Proceed Withdrawal"
      />
    </main>
  );
}
