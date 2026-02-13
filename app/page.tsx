"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "medium" | "hard";

const EMPTY = -1;
const PUZZLE_IMAGE = "/ben-new.jpeg";

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; rows: number; cols: number }> = {
  easy: { label: "Easy", rows: 3, cols: 3 },
  medium: { label: "Medium", rows: 4, cols: 5 },
  hard: { label: "Hard", rows: 5, cols: 6 },
};

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

function PuzzleTile({ pieceId, rows, cols }: { pieceId: number; rows: number; cols: number }) {
  const pieceRow = Math.floor(pieceId / cols);
  const pieceCol = pieceId % cols;
  const backgroundPositionX = (pieceCol * 100) / Math.max(cols - 1, 1);
  const backgroundPositionY = (pieceRow * 100) / Math.max(rows - 1, 1);

  return (
    <div
      className="w-full h-full rounded-md sm:rounded-lg border border-white/[0.22] shadow-[0_4px_12px_rgba(0,0,0,0.35)] sm:shadow-[0_8px_22px_rgba(0,0,0,0.45)]"
      style={{
        backgroundImage: `url(${PUZZLE_IMAGE})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
      }}
    />
  );
}

export default function GamesPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("puzzle-difficulty");
      if (saved && saved in DIFFICULTY_CONFIG) return saved as Difficulty;
    }
    return "easy";
  });
  const [board, setBoard] = useState<number[]>(() =>
    createSolvedBoard(DIFFICULTY_CONFIG.easy.rows, DIFFICULTY_CONFIG.easy.cols),
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

  const config = useMemo(() => DIFFICULTY_CONFIG[difficulty], [difficulty]);
  const totalSlots = config.rows * config.cols;

  useEffect(() => {
    localStorage.setItem("puzzle-difficulty", difficulty);
  }, [difficulty]);

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
    setBoard(createShuffledBoard(config.rows, config.cols));
    setShowWinModal(false);
    setMounted(true);
    setElapsed(0);
    setPaused(false);
    return () => stopTimer();
  }, [config.rows, config.cols, stopTimer]);

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
      setBalance((prev) => prev + 500);
    }
  }, [solved, mounted, elapsed]);

  const moveTile = (tileIndex: number) => {
    if (paused) return;
    if (tileIndex < 0 || tileIndex >= board.length) return;
    if (board[tileIndex] === EMPTY) return;

    const canMove = getNeighbors(emptyIndex, config.rows, config.cols).includes(tileIndex);
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

  // Touch support for mobile
  const touchStartRef = useRef<{ x: number; y: number; idx: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, tileIndex: number) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, idx: tileIndex };
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
    const tileRow = Math.floor(tileIndex / config.cols);
    const tileCol = tileIndex % config.cols;
    const emptyRow = Math.floor(emptyIndex / config.cols);
    const emptyCol = emptyIndex % config.cols;

    // Check if the empty slot is adjacent in the swipe direction
    let targetIndex = -1;
    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > 0 && emptyCol === tileCol + 1 && emptyRow === tileRow) targetIndex = tileIndex; // swipe right toward empty
      if (dx < 0 && emptyCol === tileCol - 1 && emptyRow === tileRow) targetIndex = tileIndex; // swipe left toward empty
    } else {
      // Vertical swipe
      if (dy > 0 && emptyRow === tileRow + 1 && emptyCol === tileCol) targetIndex = tileIndex; // swipe down toward empty
      if (dy < 0 && emptyRow === tileRow - 1 && emptyCol === tileCol) targetIndex = tileIndex; // swipe up toward empty
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
    setBoard(createShuffledBoard(config.rows, config.cols));
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
            <h1 className="m-0 text-[clamp(1.1rem,3vw,2rem)] font-medium">Puzzlez</h1>
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <div className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 tabular-nums font-mono text-xs sm:text-sm">
                ⏱ {formatTime(elapsed)}
              </div>
              <button className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed" onClick={togglePause}>
                {paused ? "▶ Resume" : "⏸ Pause"}
              </button>
              <button className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed" onClick={openWithdrawModal} disabled={balance < 10000}>
                Withdraw
              </button>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <div className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm">Balance: {formatNaira(balance)}</div>
            <select
              className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm min-w-[140px] sm:min-w-[170px]"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => (
                <option key={level} value={level}>
                  {DIFFICULTY_CONFIG[level].label} ({DIFFICULTY_CONFIG[level].rows}x{DIFFICULTY_CONFIG[level].cols})
                </option>
              ))}
            </select>
            <button className="rounded-full border border-white/25 bg-transparent text-white py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed" onClick={resetGame}>Reset</button>
          </div>

          <div className="relative min-h-0 overflow-hidden rounded-xl sm:rounded-[14px] border border-white/[0.12] bg-black/45 p-1.5 sm:p-2.5" style={{ containerType: 'size' }}>
            {paused && (
              <div className="absolute inset-0 z-20 rounded-[14px] bg-black/80 backdrop-blur-md grid place-items-center">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">⏸</div>
                  <p className="text-white/80 text-lg sm:text-xl font-medium mb-3 sm:mb-4">Game Paused</p>
                  <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6">Time: {formatTime(elapsed)}</p>
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
                gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
                aspectRatio: `${config.cols} / ${config.rows}`,
                width: `min(100%, calc(100cqh * ${config.cols / config.rows}))`,
                maxHeight: '100%',
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

                const movable = getNeighbors(emptyIndex, config.rows, config.cols).includes(idx);

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
                    <PuzzleTile pieceId={pieceId} rows={config.rows} cols={config.cols} />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="hidden min-[1060px]:grid border border-white/[0.12] rounded-2xl sm:rounded-[18px] bg-white/[0.04] min-h-0 p-2 sm:p-3.5 min-[1060px]:grid-rows-[auto_1fr] min-[1060px]:gap-3.5">
          <div className="">
            <p className="m-0 mb-1.5 sm:mb-2 text-white/75 text-xs sm:text-sm">Preview</p>
            <Image
              src={PUZZLE_IMAGE}
              alt="Puzzle preview"
              width={1536}
              height={2048}
              className="w-full h-auto rounded-lg sm:rounded-[10px] border border-white/[0.18]"
              priority
            />
          </div>

          <div className="rounded-lg sm:rounded-xl border border-white/[0.12] bg-white/[0.03] p-2 sm:p-2.5 text-white/75 text-xs sm:text-[0.88rem]">
            <p className="m-0 mb-1 sm:mb-1.5">Drag a tile into the empty slot if it touches that slot.</p>
            <p className="m-0 mb-0 sm:mb-1.5">Only adjacent tiles can move.</p>
          </div>
        </aside>
      </div>

      {showWinModal ? (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4 z-40 animate-[fadeIn_0.3s_ease-out]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[640px] rounded-2xl sm:rounded-3xl border bg-gradient-to-b from-[#1c1a0e] via-[#121212] to-[#060606] p-5 sm:p-8 text-center shadow-[0_0_80px_rgba(250,204,21,0.12)] animate-[popIn_0.4s_ease-out]">
            <h2 className="m-0 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Puzzle Champion!
            </h2>
            <div className="mt-3 sm:mt-4 inline-block rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-1.5 sm:px-5 sm:py-2">
              <span className="text-yellow-300 font-semibold text-base sm:text-lg">🎉 You just unlocked ₦5,000</span>
            </div>
            <div className="mt-2.5 sm:mt-3 inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 sm:px-4 sm:py-1.5">
              <span className="text-white/70 font-mono text-xs sm:text-sm">⏱ Completed in {formatTime(winTime)}</span>
            </div>
            <p className="mt-3 sm:mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              Smooth moves. Clean finish. You solved the puzzle like an absolute pro.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              <button
                className="rounded-full border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-200 py-2.5 px-5 sm:py-3 sm:px-6 text-sm sm:text-base font-medium transition-colors"
                onClick={() => {
                  setShowWinModal(false);
                  resetGame();
                }}
              >
                Play Again
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4 z-40" role="dialog" aria-modal="true">
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
              <p className="m-0 text-white/50 text-xs uppercase tracking-wide">Available Balance</p>
              <p className="m-0 text-white text-lg sm:text-xl font-semibold mt-0.5">{formatNaira(balance)}</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">Bank</label>
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
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">Account Number</label>
                <input
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="0000000000"
                />
                {!accountValid && accountNumber.length > 0 ? (
                  <p className="mt-1.5 text-rose-400 text-xs">Must be exactly 10 digits.</p>
                ) : null}
              </div>

              <div className="border-t border-white/[0.08] pt-4">
                <label className="block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">Verification</label>
                <p className="m-0 text-white/80 text-sm mb-2 font-mono bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.08]">{mathQuestion}</p>
                <input
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  placeholder="Your answer"
                />
                {mathInput.length > 0 && !challengePassed ? (
                  <p className="mt-1.5 text-rose-400 text-xs">Incorrect. Try again.</p>
                ) : null}
              </div>
            </div>

            {withdrawDone ? (
              <div className="mt-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 px-4 py-3 text-sm">
                Transfer submitted to <span className="font-medium text-emerald-200">{selectedBank}</span>. Your balance is now {formatNaira(balance)}.
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
