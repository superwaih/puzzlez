"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EMPTY = -1;

const LEVELS = [
  { label: "Level 1", image: "/levels/level-2.jpeg", rows: 3, cols: 4 },
  { label: "Level 2", image: "/levels/level-3.jpeg", rows: 3, cols: 4 },
  { label: "Level 3", image: "/levels/level-4.jpeg", rows: 4, cols: 4 },
  { label: "Level 4", image: "/levels/level-5.jpeg", rows: 4, cols: 5 },
  { label: "Level 5", image: "/levels/level-6.jpeg", rows: 4, cols: 5 },
  { label: "Level 6", image: "/levels/level-7.jpeg", rows: 5, cols: 5 },
  { label: "Level 7", image: "/levels/level-8.jpeg", rows: 5, cols: 6 },
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
    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    [board[emptyIndex], board[randomNeighbor]] = [board[randomNeighbor], board[emptyIndex]];
    emptyIndex = randomNeighbor;
  }

  const solved = board.every((value, idx) => {
    if (idx === total - 1) return value === EMPTY;
    return value === idx;
  });

  if (solved) {
    const neighbors = getNeighbors(emptyIndex, rows, cols);
    const swapIndex = neighbors[0];
    [board[emptyIndex], board[swapIndex]] = [board[swapIndex], board[emptyIndex]];
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

  const answer = ((a ** 3 - b ** 3) / e) + c * d - (a + b);
  const question = `Compute: (( ${a}^3 - ${b}^3 ) / ${e}) + (${c} × ${d}) - (${a} + ${b})`;
  return { question, answer };
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PuzzleTile({ pieceId, rows, cols, image }: { pieceId: number; rows: number; cols: number; image: string }) {
  const pieceRow = Math.floor(pieceId / cols);
  const pieceCol = pieceId % cols;
  const backgroundPositionX = (pieceCol * 100) / Math.max(cols - 1, 1);
  const backgroundPositionY = (pieceRow * 100) / Math.max(rows - 1, 1);

  return (
    <div
      className="w-full h-full rounded-lg border border-white/[0.22] shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
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
  const [board, setBoard] = useState<number[]>(() => createSolvedBoard(LEVELS[0].rows, LEVELS[0].cols));
  const [mounted, setMounted] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [balance, setBalance] = useState(50000000);
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

  const emptyIndex = useMemo(() => board.indexOf(EMPTY), [board]);

  const solved = useMemo(() => {
    return board.every((value, idx) => {
      if (idx === totalSlots - 1) return value === EMPTY;
      return value === idx;
    });
  }, [board, totalSlots]);

  useEffect(() => {
    if (solved && mounted && !showWinModal) {
      setWinTime(elapsed);
      setShowWinModal(true);
      setCompletedLevels((prev) => (prev.includes(currentLevelIndex) ? prev : [...prev, currentLevelIndex]));
      setMaxUnlockedLevel((prev) => {
        const next = Math.max(prev, Math.min(currentLevelIndex + 1, LEVELS.length - 1));
        return next;
      });
    }
  }, [solved, mounted, elapsed, showWinModal, currentLevelIndex]);

  const moveTile = (tileIndex: number) => {
    if (tileIndex < 0 || tileIndex >= board.length) return;
    if (board[tileIndex] === EMPTY) return;

    const canMove = getNeighbors(emptyIndex, currentLevel.rows, currentLevel.cols).includes(tileIndex);
    if (!canMove) return;

    setBoard((prev) => {
      const next = [...prev];
      const nextEmpty = next.indexOf(EMPTY);
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

  const selectLevel = (levelIndex: number) => {
    if (levelIndex > maxUnlockedLevel) return;
    setCurrentLevelIndex(levelIndex);
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
                {LEVELS.map((level, idx) => {
                  const isUnlocked = idx <= maxUnlockedLevel;
                  const isActive = idx === currentLevelIndex;
                  const isCompleted = completedLevels.includes(idx);

                  return (
                    <button
                      key={`top-${level.label}`}
                      type="button"
                      onClick={() => selectLevel(idx)}
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
                if (pieceId === EMPTY) {
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
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map((level, idx) => {
                const isUnlocked = idx <= maxUnlockedLevel;
                const isActive = idx === currentLevelIndex;
                const isCompleted = completedLevels.includes(idx);

                return (
                  <button
                    key={level.label}
                    type="button"
                    onClick={() => selectLevel(idx)}
                    disabled={!isUnlocked}
                    className={`relative overflow-hidden rounded-lg border p-0 text-left transition ${
                      isActive
                        ? "border-yellow-300/70"
                        : "border-white/20"
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

          <Link href="/" className="underline underline-offset-4 text-white/80 text-sm">Back home</Link>
        </aside>
      </div>

      {showWinModal ? (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-4 z-40 animate-[fadeIn_0.3s_ease-out]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[640px] rounded-3xl border bg-gradient-to-b from-[#1c1a0e] via-[#121212] to-[#060606] p-8 text-center shadow-[0_0_80px_rgba(250,204,21,0.12)] animate-[popIn_0.4s_ease-out]">
            <h2 className="m-0 text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Puzzle Champion!
            </h2>
            <div className="mt-4 inline-block rounded-full border border-yellow-400/20 bg-yellow-400/10 px-5 py-2">
              <span className="text-yellow-300 font-semibold text-lg">🎉 You just unlocked ₦50,000,000</span>
            </div>
            <div className="mt-3 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5">
              <span className="text-white/70 font-mono text-sm">⏱ Completed in {formatTime(winTime)}</span>
            </div>
            <div className="mt-4 mx-auto max-w-[220px] overflow-hidden rounded-xl border border-white/20">
              <Image
                src={currentLevel.image}
                alt={`${currentLevel.label} complete preview`}
                width={600}
                height={800}
                className="w-full h-auto blur-[2px] scale-[1.04]"
              />
            </div>
            <p className="mt-4 text-white/70 text-lg leading-relaxed max-w-md mx-auto">
              Smooth moves. Clean finish. You solved the puzzle like an absolute pro.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                className="rounded-full border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-200 py-3 px-6 text-base font-medium transition-colors"
                onClick={() => {
                  setShowWinModal(false);
                  resetGame();
                }}
              >
                Play Again
              </button>
              <button
                className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 py-3 px-6 text-base font-medium transition-colors"
                onClick={() => setShowWinModal(false)}
              >
                Celebrate Later
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {withdrawOpen ? (
        <div className="fixed inset-0 bg-black/75 grid place-items-center p-4 z-40" role="dialog" aria-modal="true">
          <div className="w-full max-w-[520px] rounded-[14px] border border-white/20 bg-gradient-to-b from-[#161616] to-[#060606] p-4">
            <h2 className="m-0 text-xl">Withdraw Balance</h2>
            <p className="mt-2 text-white/80">Complete all steps correctly to proceed.</p>

            <div className="mt-2.5">
              <p className="m-0 mb-1.5 text-white/[0.86] text-sm">Select Bank</p>
              <select
                className="w-full rounded-[10px] border border-white/20 bg-white/[0.02] text-white py-2.5 px-3"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
              >
                <option value="">Choose a Nigerian bank</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5">
              <p className="m-0 mb-1.5 text-white/[0.86] text-sm">Account Number</p>
              <input
                className="w-full rounded-[10px] border border-white/20 bg-white/[0.02] text-white py-2.5 px-3"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                placeholder="10-digit account number"
              />
              {!accountValid && accountNumber.length > 0 ? (
                <p className="mt-1 text-rose-300 text-xs">Enter a valid 10-digit account number.</p>
              ) : null}
            </div>

            <div className="mt-2.5">
              <p className="m-0 mb-1.5 text-white/[0.86] text-sm">Mathematics Verification</p>
              <p className="mt-2 text-white/80">{mathQuestion}</p>
              <input
                className="w-full rounded-[10px] border border-white/20 bg-white/[0.02] text-white py-2.5 px-3"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Enter exact answer"
              />
              {mathInput.length > 0 && !challengePassed ? (
                <p className="mt-1 text-rose-300 text-xs">Incorrect answer. You cannot proceed until this is correct.</p>
              ) : null}
            </div>

            {withdrawDone ? (
              <div className="mt-2.5 rounded-[10px] border border-emerald-400/35 bg-emerald-500/15 text-green-100 p-2.5 text-sm">
                Transfer submitted to {selectedBank}. Balance is now {formatNaira(balance)}.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 mt-3.5">
              <button className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed" onClick={() => setWithdrawOpen(false)}>
                Close
              </button>
              <button className="rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleWithdraw} disabled={!canWithdraw || withdrawDone}>
                Proceed Withdrawal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
