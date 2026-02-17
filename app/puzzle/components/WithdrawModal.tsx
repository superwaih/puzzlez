
type WithdrawModalProps = {
  isOpen: boolean;
  variant: "home" | "games";
  title: string;
  subtitle?: string;
  showAvailableBalance: boolean;
  balanceText: string;
  banks: readonly string[];
  selectedBank: string;
  onSelectedBankChange: (value: string) => void;
  accountNumber: string;
  onAccountNumberChange: (value: string) => void;
  accountPlaceholder: string;
  accountValid: boolean;
  mathQuestion: string;
  mathInput: string;
  onMathInputChange: (value: string) => void;
  challengePassed: boolean;
  withdrawDone: boolean;
  doneMessage: string;
  canWithdraw: boolean;
  onClose: () => void;
  onSubmit: () => void;
  closeLabel: string;
  submitLabel: string;
};

export function WithdrawModal({
  isOpen,
  variant,
  title,
  subtitle,
  showAvailableBalance,
  balanceText,
  banks,
  selectedBank,
  onSelectedBankChange,
  accountNumber,
  onAccountNumberChange,
  accountPlaceholder,
  accountValid,
  mathQuestion,
  mathInput,
  onMathInputChange,
  challengePassed,
  withdrawDone,
  doneMessage,
  canWithdraw,
  onClose,
  onSubmit,
  closeLabel,
  submitLabel,
}: WithdrawModalProps) {
  if (!isOpen) return null;

  const isHome = variant === "home";

  return (
    <div
      className={
        isHome
          ? "fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center p-3 sm:p-4 z-40"
          : "fixed inset-0 bg-black/75 grid place-items-center p-4 z-40"
      }
      role="dialog"
      aria-modal="true"
    >
      <div
        className={
          isHome
            ? "w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-4 sm:p-6 shadow-2xl"
            : "w-full max-w-[520px] rounded-[14px] border border-white/20 bg-gradient-to-b from-[#161616] to-[#060606] p-4"
        }
      >
        {isHome ? (
          <div className="flex items-center justify-between mb-1">
            <h2 className="m-0 text-lg font-semibold">{title}</h2>
            <button
              className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none p-1"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <h2 className="m-0 text-xl">{title}</h2>
            {subtitle ? <p className="mt-2 text-white/80">{subtitle}</p> : null}
          </>
        )}

        {showAvailableBalance ? (
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 sm:px-4 sm:py-3 mb-4 sm:mb-5">
            <p className="m-0 text-white/50 text-xs uppercase tracking-wide">Available Balance</p>
            <p className="m-0 text-white text-lg sm:text-xl font-semibold mt-0.5">{balanceText}</p>
          </div>
        ) : null}

        <div className={isHome ? "space-y-3 sm:space-y-4" : "space-y-2.5 mt-2.5"}>
          <div>
            <label className={isHome ? "block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5" : "block text-white/[0.86] text-sm mb-1.5"}>
              Select Bank
            </label>
            <select
              className={
                isHome
                  ? "w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  : "w-full rounded-[10px] border border-white/20 bg-white/[0.02] text-white py-2.5 px-3"
              }
              value={selectedBank}
              onChange={(e) => onSelectedBankChange(e.target.value)}
            >
              <option value="">{isHome ? "Select your bank" : "Choose a Nigerian bank"}</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={isHome ? "block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5" : "block text-white/[0.86] text-sm mb-1.5"}>
              Account Number
            </label>
            <input
              className={
                isHome
                  ? "w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  : "w-full rounded-[10px] border border-white/20 bg-white/[0.02] text-white py-2.5 px-3"
              }
              value={accountNumber}
              onChange={(e) => onAccountNumberChange(e.target.value)}
              inputMode="numeric"
              placeholder={accountPlaceholder}
            />
            {!accountValid && accountNumber.length > 0 ? (
              <p className={isHome ? "mt-1.5 text-rose-400 text-xs" : "mt-1 text-rose-300 text-xs"}>
                {isHome ? "Must be exactly 10 digits." : "Enter a valid 10-digit account number."}
              </p>
            ) : null}
          </div>

          <div className={isHome ? "border-t border-white/[0.08] pt-4" : ""}>
            <label className={isHome ? "block text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5" : "block text-white/[0.86] text-sm mb-1.5"}>
              {isHome ? "Verification" : "Mathematics Verification"}
            </label>
            <p
              className={
                isHome
                  ? "m-0 text-white/80 text-sm mb-2 font-mono bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.08]"
                  : "mt-2 text-white/80"
              }
            >
              {mathQuestion}
            </p>
            <input
              className={
                isHome
                  ? "w-full rounded-lg border border-white/[0.12] bg-white/[0.04] text-white py-2.5 px-3 focus:outline-none focus:border-white/30 transition-colors"
                  : "w-full rounded-[10px] border border-white/20 bg-white/[0.02] text-white py-2.5 px-3"
              }
              value={mathInput}
              onChange={(e) => onMathInputChange(e.target.value)}
              placeholder={isHome ? "Your answer" : "Enter exact answer"}
            />
            {mathInput.length > 0 && !challengePassed ? (
              <p className={isHome ? "mt-1.5 text-rose-400 text-xs" : "mt-1 text-rose-300 text-xs"}>
                {isHome ? "Incorrect. Try again." : "Incorrect answer. You cannot proceed until this is correct."}
              </p>
            ) : null}
          </div>
        </div>

        {withdrawDone ? (
          <div
            className={
              isHome
                ? "mt-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 px-4 py-3 text-sm"
                : "mt-2.5 rounded-[10px] border border-emerald-400/35 bg-emerald-500/15 text-green-100 p-2.5 text-sm"
            }
          >
            {doneMessage}
          </div>
        ) : null}

        <div className={isHome ? "flex gap-2.5 sm:gap-3 mt-4 sm:mt-5" : "flex flex-wrap gap-2 mt-3.5"}>
          <button
            className={
              isHome
                ? "flex-1 rounded-lg border border-white/[0.12] bg-transparent text-white/70 hover:text-white hover:bg-white/[0.06] py-2.5 text-sm font-medium transition-colors"
                : "rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            }
            onClick={onClose}
          >
            {closeLabel}
          </button>
          <button
            className={
              isHome
                ? "flex-1 rounded-lg border border-white/20 bg-white text-black py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white"
                : "rounded-full border border-white/25 bg-transparent text-white py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            }
            onClick={onSubmit}
            disabled={!canWithdraw || withdrawDone}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
