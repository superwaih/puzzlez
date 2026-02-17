"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY = -1;
const LEVELS = [
  { label: "Level 1", image: "/ben-new.jpeg", rows: 3, cols: 3 },
  { label: "Level 2", image: "/levels/level-3.jpeg", rows: 3, cols: 3 },
  { label: "Level 3", image: "/levels/level-4.jpeg", rows: 3, cols: 4 },
  { label: "Level 4", image: "/levels/level-5.jpeg", rows: 3, cols: 4 },
  { label: "Level 5", image: "/levels/level-6.jpeg", rows: 4, cols: 4 },
  { label: "Level 6", image: "/levels/level-7.jpeg", rows: 4, cols: 5 },
  { label: "Level 7", image: "/levels/level-8.jpeg", rows: 4, cols: 4 },
] as const;

const BANKS = [
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
];

function getNeighbors(index: number, rows: number, cols: number) {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const neighbors: number[] = [];
  if (r > 0) neighbors.push(index - cols);
  if (r < rows - 1) neighbors.push(index + cols);
  if (c > 0) neighbors.push(index - 1);
  if (c < cols - 1) neighbors.push(index + 1);
  return neighbors;
}

function createSolvedBoard(rows: number, cols: number) {
  const total = rows * cols;
  const board = Array.from({ length: total }, (_, idx) => idx);
  board[total - 1] = EMPTY;
  return board;
}

function createShuffledBoard(rows: number, cols: number) {
  const total = rows * cols;
  const board = createSolvedBoard(rows, cols);
  let emptyIndex = total - 1;

  const shuffleMoves = total * 35;
  for (let i = 0; i < shuffleMoves; i += 1) {
    const neighbors = getNeighbors(emptyIndex, rows, cols);
    const randomNeighbor =
      neighbors[Math.floor(Math.random() * neighbors.length)];
    [board[emptyIndex], board[randomNeighbor]] = [
      board[randomNeighbor],
      board[emptyIndex],
    ];
    emptyIndex = randomNeighbor;
  }

  const solved = board.every((value, idx) => {
    if (idx === total - 1) return value === EMPTY;
    return value === idx;
  });

  if (solved) {
    const neighbors = getNeighbors(emptyIndex, rows, cols);
    const swapIndex = neighbors[0];
    [board[emptyIndex], board[swapIndex]] = [
      board[swapIndex],
      board[emptyIndex],
    ];
  }

  return board;
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function generateMathChallenge() {
  const a = 17 + Math.floor(Math.random() * 7);
  const b = 11 + Math.floor(Math.random() * 5);
  const c = 23 + Math.floor(Math.random() * 7);
  const d = 9 + Math.floor(Math.random() * 7);
  const e = 6 + Math.floor(Math.random() * 6);

  const answer = (a ** 3 - b ** 3) / e + c * d - (a + b);
  const question = `Compute: (( ${a}^3 - ${b}^3 ) / ${e}) + (${c} × ${d}) - (${a} + ${b})`;
  return { question, answer };
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PuzzleTile({
  pieceId,
  rows,
  cols,
  image,
}: {
  pieceId: number;
  rows: number;
  cols: number;
  image: string;
}) {
  const pieceRow = Math.floor(pieceId / cols);
  const pieceCol = pieceId % cols;
  const backgroundPositionX = (pieceCol * 100) / Math.max(cols - 1, 1);
  const backgroundPositionY = (pieceRow * 100) / Math.max(rows - 1, 1);

  return (
    <div
      className="w-full h-full rounded-md sm:rounded-lg border border-white/[0.22] shadow-[0_4px_12px_rgba(0,0,0,0.35)] sm:shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
      }}
    />
  );
}

export default function GamesPage() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("puzzle-current-level") ?? 0);
      if (Number.isInteger(saved) && saved >= 0 && saved < LEVELS.length) return saved;
    }
    return 0;
  });
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("puzzle-max-unlocked-level") ?? 0);
      if (Number.isInteger(saved) && saved >= 0 && saved < LEVELS.length) return saved;
    }
    return 0;
  });
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("puzzle-completed-levels");
      if (!saved) return [];
      try {
        const parsed = JSON.parse(saved) as number[];
        return parsed.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < LEVELS.length);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [board, setBoard] = useState<number[]>(() =>
    createSolvedBoard(LEVELS[0].rows, LEVELS[0].cols),
  );
  const [mounted, setMounted] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [balance, setBalance] = useState(500);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [winTime, setWinTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mathInput, setMathInput] = useState("");
  const [mathQuestion, setMathQuestion] = useState("");
  const [mathAnswer, setMathAnswer] = useState<number>(0);
  const [withdrawDone, setWithdrawDone] = useState(false);

  const currentLevel = useMemo(() => LEVELS[currentLevelIndex], [currentLevelIndex]);
  const totalSlots = currentLevel.rows * currentLevel.cols;

  useEffect(() => {
    localStorage.setItem("puzzle-current-level", String(currentLevelIndex));
  }, [currentLevelIndex]);

  useEffect(() => {
    localStorage.setItem("puzzle-max-unlocked-level", String(maxUnlockedLevel));
  }, [maxUnlockedLevel]);

  useEffect(() => {
    localStorage.setItem("puzzle-completed-levels", JSON.stringify(completedLevels));
  }, [completedLevels]);

  useEffect(() => {
    if (currentLevelIndex > maxUnlockedLevel) {
      setCurrentLevelIndex(maxUnlockedLevel);
    }
  }, [currentLevelIndex, maxUnlockedLevel]);

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

  const emptyIndex = useMemo(() => board.indexOf(EMPTY), [board]);

  const solved = useMemo(() => {
    return board.every((value, idx) => {
      if (idx === totalSlots - 1) return value === EMPTY;
      return value === idx;
    });
  }, [board, totalSlots]);

  useEffect(() => {
    if (solved && mounted) {
      setWinTime(elapsed);
      setShowWinModal(true);
      setCompletedLevels((prev) => (prev.includes(currentLevelIndex) ? prev : [...prev, currentLevelIndex]));
      setMaxUnlockedLevel((prev) => Math.max(prev, Math.min(currentLevelIndex + 1, LEVELS.length - 1)));
      setBalance((prev) => prev + 500);
    }
  }, [solved, mounted, elapsed, currentLevelIndex]);

  const moveTile = (tileIndex: number) => {
    if (paused) return;
    if (tileIndex < 0 || tileIndex >= board.length) return;
    if (board[tileIndex] === EMPTY) return;

    const canMove = getNeighbors(emptyIndex, currentLevel.rows, currentLevel.cols).includes(
      tileIndex,
    );
    if (!canMove) return;

    setBoard((prev) => {
      const next = [...prev];
      const nextEmpty = next.indexOf(EMPTY);
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
    if (currentLevelIndex < LEVELS.length - 1) {
      setShowWinModal(false);
      setCurrentLevelIndex(currentLevelIndex + 1);
      setElapsed(0);
      setPaused(false);
      return;
    }
    setShowWinModal(false);
    resetGame();
  };

  const selectLevel = (levelIndex: number) => {
    if (levelIndex > maxUnlockedLevel) return;
    setCurrentLevelIndex(levelIndex);
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
                disabled={balance < 10000}
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
                if (pieceId === EMPTY) {
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
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map((level, idx) => {
                const isUnlocked = idx <= maxUnlockedLevel;
                const isActive = idx === currentLevelIndex;
                const isCompleted = completedLevels.includes(idx);

                return (
                  <button
                    key={`sidebar-${level.label}`}
                    type="button"
                    onClick={() => selectLevel(idx)}
                    disabled={!isUnlocked}
                    className={`relative overflow-hidden rounded-lg border p-0 text-left transition ${
                      isActive ? "border-yellow-300/70" : "border-white/20"
                    } ${isUnlocked ? "cursor-pointer" : "cursor-not-allowed opacity-65"}`}
                    aria-label={`${level.label}${isUnlocked ? "" : " locked"}`}
                  >
                    <Image src={level.image} alt={level.label} width={400} height={520} className="h-20 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-[11px] text-white/90 flex items-center justify-between">
                      <span>{level.label}</span>
                      <span>{isUnlocked ? (isCompleted ? "Done" : "Open") : "Locked"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showWinModal ? (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4 z-40 animate-[fadeIn_0.3s_ease-out]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[640px] rounded-2xl sm:rounded-3xl border bg-gradient-to-b from-[#1c1a0e] via-[#121212] to-[#060606] p-5 sm:p-8 text-center shadow-[0_0_80px_rgba(250,204,21,0.12)] animate-[popIn_0.4s_ease-out]">
            <h2 className="m-0 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Puzzle Champion!
            </h2>
            <div className="mt-3 sm:mt-4 inline-block rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-1.5 sm:px-5 sm:py-2">
              <span className="text-yellow-300 font-semibold text-base sm:text-lg">
                🎉 You just unlocked ₦5,000
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3 inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 sm:px-4 sm:py-1.5">
              <span className="text-white/70 font-mono text-xs sm:text-sm">
                ⏱ Completed in {formatTime(winTime)}
              </span>
            </div>
            <p className="mt-3 sm:mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              Smooth moves. Clean finish. You solved the puzzle like an absolute
              pro.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              <button
                className="rounded-full border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-200 py-2.5 px-5 sm:py-3 sm:px-6 text-sm sm:text-base font-medium transition-colors"
                onClick={playNextLevel}
              >
                {currentLevelIndex < LEVELS.length - 1
                  ? "Play Next Level"
                  : "Play Again"}
              </button>
              <button
                className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 py-2.5 px-5 sm:py-3 sm:px-6 text-sm sm:text-base font-medium transition-colors"
                onClick={() => {
                  setShowWinModal(false);
                  openWithdrawModal();
                }}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {withdrawOpen ? (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4 z-40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="m-0 text-lg font-semibold">Withdraw</h2>
              <button
                className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none p-1"
                onClick={() => setWithdrawOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 sm:px-4 sm:py-3 mb-4 sm:mb-5">
              <p className="m-0 text-white/50 text-xs uppercase tracking-wide">
                Available Balance
              </p>
              <p className="m-0 text-white text-lg sm:text-xl font-semibold mt-0.5">
                {formatNaira(balance)}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">
                  Bank
                </label>
                <select
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="">Select your bank</option>
                  {BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">
                  Account Number
                </label>
                <input
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  inputMode="numeric"
                  placeholder="0000000000"
                />
                {!accountValid && accountNumber.length > 0 ? (
                  <p className="mt-1.5 text-rose-400 text-xs">
                    Must be exactly 10 digits.
                  </p>
                ) : null}
              </div>

              <div className="border-t border-white/[0.08] pt-4">
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">
                  Verification
                </label>
                <p className="m-0 text-white/80 text-sm mb-2 font-mono bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.08]">
                  {mathQuestion}
                </p>
                <input
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  placeholder="Your answer"
                />
                {mathInput.length > 0 && !challengePassed ? (
                  <p className="mt-1.5 text-rose-400 text-xs">
                    Incorrect. Try again.
                  </p>
                ) : null}
              </div>
            </div>

            {withdrawDone ? (
              <div className="mt-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 px-4 py-3 text-sm">
                Transfer submitted to{" "}
                <span className="font-medium text-emerald-200">
                  {selectedBank}
                </span>
                . Your balance is now {formatNaira(balance)}.
              </div>
            ) : null}

            <div className="flex gap-2.5 sm:gap-3 mt-4 sm:mt-5">
              <button
                className="flex-1 rounded-lg border border-white/[0.12] bg-transparent text-white/70 hover:text-white hover:bg-white/[0.06] py-2.5 text-sm font-medium transition-colors"
                onClick={() => setWithdrawOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg border border-white/20 bg-white text-black py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
                onClick={handleWithdraw}
                disabled={!canWithdraw || withdrawDone}
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
