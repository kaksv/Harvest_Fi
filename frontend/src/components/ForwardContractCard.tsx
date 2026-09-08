import { useState } from "react";
import { formatUnits } from "viem";
import type { ForwardContract } from "../hooks/useContracts";
import { useInvest } from "../hooks/useInvest";

const STATUS       = ["Funding", "Settled", "Cancelled"];
const STATUS_COLOR = ["text-harvest-green", "text-harvest-amber", "text-red-500"];
const STATUS_BG    = ["bg-green-50", "bg-amber-50", "bg-red-50"];

// Commodity forward premium assumption: 12% annualised
const ANNUAL_RATE = 0.12;

type Props = { fc: ForwardContract };

export function ForwardContractCard({ fc }: Props) {
  const [amount, setAmount]   = useState("");
  const [txHash, setTxHash]   = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const { invest, isWriting } = useInvest();

  const pct = fc.targetAmount > 0n
    ? Number((fc.raisedAmount * 100n) / fc.targetAmount)
    : 0;

  const remaining = fc.targetAmount - fc.raisedAmount;

  const nowSec   = Math.floor(Date.now() / 1000);
  const daysLeft = Math.max(0, Math.floor((Number(fc.deadline) - nowSec) / 86_400));

  // APY derived from days remaining
  const periodReturn = ANNUAL_RATE * (daysLeft / 365);
  const apyDisplay   = `${(ANNUAL_RATE * 100).toFixed(0)}% APY`;
  const returnPct    = `+${(periodReturn * 100).toFixed(1)}%`;

  // Expected return on typed amount
  const amountNum     = parseFloat(amount) || 0;
  const expectedReturn = amountNum > 0
    ? `+$${(amountNum * periodReturn).toFixed(2)} in ${daysLeft}d`
    : null;

  const deadline = new Date(Number(fc.deadline) * 1000).toLocaleDateString("en-UG", {
    day: "numeric", month: "short", year: "numeric",
  });

  async function handleInvest() {
    setError(null);
    try {
      const amountUsdc = BigInt(Math.round(parseFloat(amount) * 1e6));
      const { investTx } = await invest(fc.id, amountUsdc);
      setTxHash(investTx);
      setAmount("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-harvest-cream flex flex-col overflow-hidden hover:shadow-md transition">

      {/* Colour band + status */}
      <div className={`px-5 pt-5 pb-4 ${STATUS_BG[fc.status]}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-0.5">Contract #{String(fc.id)}</p>
            <p className="text-sm font-bold text-harvest-brown">
              {fc.metadataCID.startsWith("{")
                ? (() => { try { return JSON.parse(fc.metadataCID).crop + " Harvest"; } catch { return "Crop Harvest"; } })()
                : "Crop Harvest"}
            </p>
          </div>
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white ${STATUS_COLOR[fc.status]}`}>
            {STATUS[fc.status]}
          </span>
        </div>

        {/* APY + days pills */}
        {fc.status === 0 && (
          <div className="flex gap-2">
            <span className="text-xs font-bold bg-harvest-green text-white px-2.5 py-1 rounded-full">
              {apyDisplay}
            </span>
            <span className="text-xs font-semibold bg-white text-harvest-brown border border-harvest-cream px-2.5 py-1 rounded-full">
              {returnPct} in {daysLeft}d
            </span>
            <span className="text-xs text-gray-400 bg-white border border-harvest-cream px-2.5 py-1 rounded-full">
              ⏳ {daysLeft} days left
            </span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex flex-col gap-4 flex-1">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1 mt-3">
            <span className="font-semibold text-harvest-green">${formatUnits(fc.raisedAmount, 6)} raised</span>
            <span>${formatUnits(fc.targetAmount, 6)} goal</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-harvest-green transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{pct}% funded</span>
            <span>${formatUnits(remaining, 6)} remaining</span>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
          <span>📅 Delivery deadline</span>
          <span className="font-semibold">{deadline}</span>
        </div>

        {/* Invest form */}
        {fc.status === 0 && (
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                placeholder="USDC amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-harvest-green"
              />
              <button
                onClick={handleInvest}
                disabled={isWriting || !amount}
                className="bg-harvest-green text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-opacity-90 transition whitespace-nowrap"
              >
                {isWriting ? "Confirming…" : "Invest"}
              </button>
            </div>

            {/* Live return preview */}
            {expectedReturn && (
              <p className="text-xs text-harvest-green font-semibold text-center bg-green-50 rounded-lg py-1.5">
                💸 Expected return: {expectedReturn}
              </p>
            )}
          </div>
        )}

        {txHash && (
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-harvest-green underline truncate"
          >
            ✅ Invested → {txHash.slice(0, 20)}…
          </a>
        )}
        {error && <p className="text-xs text-red-500 break-words">{error}</p>}
      </div>
    </div>
  );
}
