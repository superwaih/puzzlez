"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LevelPreviewGrid } from "./puzzle/components/LevelPreviewGrid";
import { PuzzleTile } from "./puzzle/components/PuzzleTile";
import { WinModal } from "./puzzle/components/WinModal";
import { WithdrawModal } from "./puzzle/components/WithdrawModal";
import { BANKS, EMPTY_SLOT, HOME_LEVELS } from "./puzzle/constants";
import { useLevelProgress } from "./puzzle/hooks/useLevelProgress";
import {
  createShuffledBoard,
  createSolvedBoard,
  formatNaira,
  formatTime,
  generateMathChallenge,
  getNeighbors,
  isBoardSolved,
} from "./puzzle/utils";

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
  } = useLevelProgress(HOME_LEVELS);
  const [board, setBoard] = useState<number[]>(() =>
    createSolvedBoard(HOME_LEVELS[0].rows, HOME_LEVELS[0].cols),
  );
  const [mounted, setMounted] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [balance, setBalance] = useState(500);
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
    setElapsed(0);
    setPaused(false);
    return () => stopTimer();
  }, [currentLevel, stopTimer]);

  useEffect(() => {
    stopTimer();
    if (mounted && !paused && !showWinModal) {
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
      setBalance((prev) => prev + 500);
    }
  }, [solved, mounted, elapsed, currentLevelIndex, showWinModal, isAdvancingLevel, markLevelCompleted]);

  const moveTile = (tileIndex: number) => {
    if (paused) return;
    if (tileIndex < 0 || tileIndex >= board.length) return;
    if (board[tileIndex] === EMPTY_SLOT) return;

    const canMove = getNeighbors(emptyIndex, currentLevel.rows, currentLevel.cols).includes(
      tileIndex,
    );
    if (!canMove) return;

    setBoard((prev) => {
      const next = [...prev];
      const nextEmpty = next.indexOf(EMPTY_SLOT);
      [next[nextEmpty], next[tileIndex]] = [next[tileIndex], next[nextEmpty]];
      return next;
    });
  };

  const handleTileDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    tileIndex: number,
  ) => {
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

  // Touch support for mobile
  const touchStartRef = useRef<{ x: number; y: number; idx: number } | null>(
    null,
  );

  const handleTouchStart = (e: React.TouchEvent, tileIndex: number) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      idx: tileIndex,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const tileIndex = touchStartRef.current.idx;

    // If it's basically a tap (very small movement), just click-move
    if (absDx < 10 && absDy < 10) {
      moveTile(tileIndex);
      touchStartRef.current = null;
      return;
    }

    // Determine swipe direction and try to move tile toward empty
    const tileRow = Math.floor(tileIndex / currentLevel.cols);
    const tileCol = tileIndex % currentLevel.cols;
    const emptyRow = Math.floor(emptyIndex / currentLevel.cols);
    const emptyCol = emptyIndex % currentLevel.cols;

    // Check if the empty slot is adjacent in the swipe direction
    let targetIndex = -1;
    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > 0 && emptyCol === tileCol + 1 && emptyRow === tileRow)
        targetIndex = tileIndex; // swipe right toward empty
      if (dx < 0 && emptyCol === tileCol - 1 && emptyRow === tileRow)
        targetIndex = tileIndex; // swipe left toward empty
    } else {
      // Vertical swipe
      if (dy > 0 && emptyRow === tileRow + 1 && emptyCol === tileCol)
        targetIndex = tileIndex; // swipe down toward empty
      if (dy < 0 && emptyRow === tileRow - 1 && emptyCol === tileCol)
        targetIndex = tileIndex; // swipe up toward empty
    }

    if (targetIndex >= 0) {
      moveTile(targetIndex);
    }

    touchStartRef.current = null;
  };

  const togglePause = () => {
    setPaused((p) => !p);
  };

  const resetGame = () => {
    setBoard(createShuffledBoard(currentLevel.rows, currentLevel.cols));
    setShowWinModal(false);
    setElapsed(0);
    setPaused(false);
  };

  const playNextLevel = () => {
    if (hasNextLevel) {
      setIsAdvancingLevel(true);
      setShowWinModal(false);
      goToNextLevel();
      setElapsed(0);
      setPaused(false);
      return;
    }
    setShowWinModal(false);
    resetGame();
  };

  const handleSelectLevel = (levelIndex: number) => {
    const didSelect = selectLevel(levelIndex);
    if (!didSelect) return;
    setShowWinModal(false);
    setElapsed(0);
    setPaused(false);
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
    if (!canWithdraw || balance < 10000) return;
    setBalance(0);
    setWithdrawDone(true);
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  return (
    <main className="h-dvh overflow-hidden p-2 sm:p-4">
      <div className="h-full max-w-[1200px] mx-auto grid grid-cols-1 min-[1060px]:grid-cols-[minmax(0,1fr)_320px] gap-2 sm:gap-3.5">
        <section className="border border-white/[0.12] rounded-2xl sm:rounded-[18px] bg-white/[0.04] min-h-0 overflow-hidden grid grid-rows-[auto_auto_1fr] gap-2 sm:gap-3.5 p-2 sm:p-3.5">
          <div className="flex flex-wrap justify-between gap-2">
            <h1 className="m-0 text-[clamp(1.1rem,3vw,2rem)] font-medium">
              Puzzlez
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <div className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 tabular-nums font-mono text-xs sm:text-sm">
                ⏱ {formatTime(elapsed)}
              </div>
              <button
                className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={togglePause}
              >
                {paused ? "▶ Resume" : "⏸ Pause"}
              </button>
              <button
                className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={openWithdrawModal}
                // disabled={balance < }
              >
                Withdraw
              </button>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <div className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm">
              Balance: {formatNaira(balance)}
            </div>
            <div className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm">
              {currentLevel.label} ({currentLevel.rows}x{currentLevel.cols})
            </div>
            <button
              className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={resetGame}
            >
              Reset
            </button>
          </div>
          <div
            className="relative min-h-0 overflow-hidden rounded-xl sm:rounded-[14px] border border-white/[0.12] bg-black/45 p-1.5 sm:p-2.5"
            style={{ containerType: "size" }}
          >
            {paused && (
              <div className="absolute inset-0 z-20 rounded-[14px] bg-black/80 backdrop-blur-md grid place-items-center">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⏸</div>
                  <p className="text-white/80 text-lg sm:text-xl font-medium mb-3 sm:mb-4">
                    Game Paused
                  </p>
                  <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6">
                    Time: {formatTime(elapsed)}
                  </p>
                  <button
                    className="rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white py-2.5 px-6 sm:py-3 sm:px-8 text-sm sm:text-base font-medium transition-colors"
                    onClick={togglePause}
                  >
                    ▶ Resume
                  </button>
                </div>
              </div>
            )}
            <div
              className="mx-auto grid gap-0.5 sm:gap-1 border border-white/[0.12] rounded-lg sm:rounded-[10px] p-0.5 sm:p-1 bg-black/35 touch-none"
              style={{
                gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${currentLevel.rows}, minmax(0, 1fr))`,
                aspectRatio: `${currentLevel.cols} / ${currentLevel.rows}`,
                width: `min(100%, calc(100cqh * ${currentLevel.cols / currentLevel.rows}))`,
                maxHeight: "100%",
              }}
            >
              {board.map((pieceId, idx) => {
                if (pieceId === EMPTY_SLOT) {
                  return (
                    <div
                      key={`slot-${idx}`}
                      className="rounded-md sm:rounded-lg border border-dashed border-white/35 bg-white/5"
                      onDragOver={handleEmptyDragOver}
                      onDrop={handleEmptyDrop}
                    />
                  );
                }

                const movable = getNeighbors(
                  emptyIndex,
                  currentLevel.rows,
                  currentLevel.cols,
                ).includes(idx);

                return (
                  <button
                    key={`tile-${pieceId}`}
                    type="button"
                    onClick={() => moveTile(idx)}
                    draggable={movable}
                    onDragStart={(event) => handleTileDragStart(event, idx)}
                    onTouchStart={(e) => handleTouchStart(e, idx)}
                    onTouchEnd={handleTouchEnd}
                    className={`border-none bg-transparent p-0 w-full h-full rounded-md sm:rounded-lg ${movable ? "cursor-grab" : "cursor-not-allowed opacity-[0.92]"}`}
                    aria-label={`Move tile ${pieceId + 1}`}
                  >
                    <PuzzleTile
                      pieceId={pieceId}
                      rows={currentLevel.rows}
                      cols={currentLevel.cols}
                      image={currentLevel.image}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="hidden min-[1060px]:grid border border-white/[0.12] rounded-2xl sm:rounded-[18px] bg-white/[0.04] min-h-0 p-2 sm:p-3.5 min-[1060px]:grid-rows-[auto_1fr] min-[1060px]:gap-3.5">
          <div className="">
            <p className="m-0 mb-1.5 sm:mb-2 text-white/75 text-xs sm:text-sm">
              Preview
            </p>
            <Image
              src={currentLevel.image}
              alt="Puzzle preview"
              width={1536}
              height={2048}
              className="w-full h-auto rounded-lg sm:rounded-[10px] border border-white/[0.18]"
              priority
            />
          </div>

          <div className="rounded-lg sm:rounded-xl border border-white/[0.12] bg-white/[0.03] p-2 sm:p-2.5 text-white/75 text-xs sm:text-[0.88rem] space-y-2">
            <p className="m-0 text-white/85 text-xs sm:text-sm">Levels</p>
            <LevelPreviewGrid
              levels={HOME_LEVELS}
              currentLevelIndex={currentLevelIndex}
              maxUnlockedLevel={maxUnlockedLevel}
              completedLevels={completedLevels}
              onSelectLevel={handleSelectLevel}
              keyPrefix="home-sidebar"
            />
          </div>
        </aside>
      </div>

      <WinModal
        isOpen={showWinModal}
        variant="home"
        completedTimeText={formatTime(winTime)}
        hasNextLevel={hasNextLevel}
        rewardText="You just unlocked ₦5,000"
        onPrimaryAction={playNextLevel}
        onSecondaryAction={() => {
          setShowWinModal(false);
          openWithdrawModal();
        }}
        secondaryLabel="Withdraw"
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        variant="home"
        title="Withdraw"
        showAvailableBalance
        balanceText={formatNaira(balance)}
        banks={BANKS}
        selectedBank={selectedBank}
        onSelectedBankChange={setSelectedBank}
        accountNumber={accountNumber}
        onAccountNumberChange={handleAccountNumberChange}
        accountPlaceholder="0000000000"
        accountValid={accountValid}
        mathQuestion={mathQuestion}
        mathInput={mathInput}
        onMathInputChange={setMathInput}
        challengePassed={challengePassed}
        withdrawDone={withdrawDone}
        doneMessage={`Transfer submitted to ${selectedBank}. Your balance is now ${formatNaira(balance)}.`}
        canWithdraw={canWithdraw && balance >= 10000}
        onClose={() => setWithdrawOpen(false)}
        onSubmit={handleWithdraw}
        closeLabel="Cancel"
        submitLabel="Confirm Withdrawal"
      />
    </main>
  );
}
