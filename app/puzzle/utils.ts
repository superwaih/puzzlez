import { EMPTY_SLOT } from "./constants";
import type { MathChallenge } from "./types";

export function getNeighbors(index: number, rows: number, cols: number) {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const neighbors: number[] = [];

  if (r > 0) neighbors.push(index - cols);
  if (r < rows - 1) neighbors.push(index + cols);
  if (c > 0) neighbors.push(index - 1);
  if (c < cols - 1) neighbors.push(index + 1);

  return neighbors;
}

export function createSolvedBoard(rows: number, cols: number) {
  const total = rows * cols;
  const board = Array.from({ length: total }, (_, idx) => idx);
  board[total - 1] = EMPTY_SLOT;
  return board;
}

export function createShuffledBoard(rows: number, cols: number) {
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

  if (isBoardSolved(board)) {
    const neighbors = getNeighbors(emptyIndex, rows, cols);
    const swapIndex = neighbors[0];
    [board[emptyIndex], board[swapIndex]] = [board[swapIndex], board[emptyIndex]];
  }

  return board;
}

export function isBoardSolved(board: number[]) {
  const lastIndex = board.length - 1;
  return board.every((value, idx) => {
    if (idx === lastIndex) return value === EMPTY_SLOT;
    return value === idx;
  });
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function generateMathChallenge(): MathChallenge {
  const a = 17 + Math.floor(Math.random() * 7);
  const b = 11 + Math.floor(Math.random() * 5);
  const c = 23 + Math.floor(Math.random() * 7);
  const d = 9 + Math.floor(Math.random() * 7);
  const e = 6 + Math.floor(Math.random() * 6);

  const answer = ((a ** 3 - b ** 3) / e) + c * d - (a + b);
  const question = `Compute: (( ${a}^3 - ${b}^3 ) / ${e}) + (${c} × ${d}) - (${a} + ${b})`;

  return { question, answer };
}
