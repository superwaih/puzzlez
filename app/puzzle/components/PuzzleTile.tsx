type PuzzleTileProps = {
  pieceId: number;
  rows: number;
  cols: number;
  image: string;
  className?: string;
};

export function PuzzleTile({
  pieceId,
  rows,
  cols,
  image,
  className = "w-full h-full rounded-lg border border-white/[0.22] shadow-[0_8px_22px_rgba(0,0,0,0.45)]",
}: PuzzleTileProps) {
  const pieceRow = Math.floor(pieceId / cols);
  const pieceCol = pieceId % cols;
  const backgroundPositionX = (pieceCol * 100) / Math.max(cols - 1, 1);
  const backgroundPositionY = (pieceRow * 100) / Math.max(rows - 1, 1);

  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
      }}
    />
  );
}
