import Image from "next/image";

type WinModalProps = {
  isOpen: boolean;
  completedTimeText: string;
  hasNextLevel: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  secondaryLabel: string;
  rewardText: string;
  variant: "home" | "games";
  previewImageSrc?: string;
  previewImageAlt?: string;
};

export function WinModal({
  isOpen,
  completedTimeText,
  hasNextLevel,
  onPrimaryAction,
  onSecondaryAction,
  secondaryLabel,
  rewardText,
  variant,
  previewImageSrc,
  previewImageAlt,
}: WinModalProps) {
  if (!isOpen) return null;

  const wrapperClass =
    variant === "home"
      ? "fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4 z-40 animate-[fadeIn_0.3s_ease-out]"
      : "fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-4 z-40 animate-[fadeIn_0.3s_ease-out]";

  const panelClass =
    variant === "home"
      ? "w-full max-w-[640px] rounded-2xl sm:rounded-3xl border bg-gradient-to-b from-[#1c1a0e] via-[#121212] to-[#060606] p-5 sm:p-8 text-center shadow-[0_0_80px_rgba(250,204,21,0.12)] animate-[popIn_0.4s_ease-out]"
      : "w-full max-w-[640px] rounded-3xl border bg-gradient-to-b from-[#1c1a0e] via-[#121212] to-[#060606] p-8 text-center shadow-[0_0_80px_rgba(250,204,21,0.12)] animate-[popIn_0.4s_ease-out]";

  return (
    <div className={wrapperClass} role="dialog" aria-modal="true">
      <div className={panelClass}>
        <h2 className="m-0 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
          Puzzle Champion!
        </h2>
        <div className="mt-3 sm:mt-4 inline-block rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-1.5 sm:px-5 sm:py-2">
          <span className="text-yellow-300 font-semibold text-base sm:text-lg">🎉 {rewardText}</span>
        </div>
        <div className="mt-2.5 sm:mt-3 inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 sm:px-4 sm:py-1.5">
          <span className="text-white/70 font-mono text-xs sm:text-sm">⏱ Completed in {completedTimeText}</span>
        </div>

        {previewImageSrc ? (
          <div className="mt-4 mx-auto max-w-[220px] overflow-hidden rounded-xl border border-white/20">
            <Image
              src={previewImageSrc}
              alt={previewImageAlt ?? "Level complete preview"}
              width={600}
              height={800}
              className="w-full h-auto blur-[2px] scale-[1.04]"
            />
          </div>
        ) : null}

        <p className="mt-3 sm:mt-4 text-white/70 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          Smooth moves. Clean finish. You solved the puzzle like an absolute pro.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-5 sm:mt-6">
          <button
            className="rounded-full border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-200 py-2.5 px-5 sm:py-3 sm:px-6 text-sm sm:text-base font-medium transition-colors"
            onClick={onPrimaryAction}
          >
            {hasNextLevel ? "Play Next Level" : "Play Again"}
          </button>
          <button
            className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 py-2.5 px-5 sm:py-3 sm:px-6 text-sm sm:text-base font-medium transition-colors"
            onClick={onSecondaryAction}
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
