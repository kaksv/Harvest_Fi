import { usePrivy } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { Header } from "./components/Header";
import { ForwardContractCard } from "./components/ForwardContractCard";
import { RegisterPage } from "./components/RegisterPage";
import { useContracts } from "./hooks/useContracts";
import { useState } from "react";

type View = "home" | "register";

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center bg-white/10 rounded-2xl px-6 py-4 min-w-[120px]">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs font-semibold text-white/80 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
    </div>
  );
}

function Hero({ onRegister, totalRaised, activeCount, avgApy }: {
  onRegister: () => void;
  totalRaised: string;
  activeCount: number;
  avgApy: string;
}) {
  const { authenticated, login } = usePrivy();
  return (
    <div className="bg-harvest-green rounded-3xl px-5 py-10 mb-10 text-center relative overflow-hidden">
      {/* background texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none text-[120px] leading-none flex flex-wrap gap-4 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => <span key={i}>🌱</span>)}
      </div>

      <div className="relative">
        <span className="inline-block bg-harvest-amber text-harvest-brown text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          Real World Assets · Base Sepolia
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
          Earn yield by funding<br />Ugandan crop harvests
        </h1>
        <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto mb-8">
          Invest USDC into tokenised forward contracts for coffee & vanilla.
          Farmers get upfront capital. You get repaid with yield when the crop is delivered.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <StatPill label="Total Raised"    value={`$${totalRaised}`} sub="USDC" />
          <StatPill label="Active Rounds"   value={String(activeCount)} />
          <StatPill label="Est. APY"        value={avgApy} sub="annualised" />
          <StatPill label="Chain"           value="Base" sub="~$0.001 gas" />
        </div>

        {!authenticated ? (
          <button
            onClick={login}
            className="bg-harvest-amber text-harvest-brown font-bold px-8 py-3 rounded-full text-sm hover:opacity-90 transition shadow-lg"
          >
            Connect Wallet to Invest →
          </button>
        ) : (
          <button
            onClick={onRegister}
            className="bg-white/10 border border-white/20 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-white/20 transition"
          >
            🧑🌾 Are you a farmer? Register your harvest
          </button>
        )}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { emoji: "🧑🌾", title: "Cooperative registers",  body: "Uploads harvest details & GPS proof-of-farm" },
    { emoji: "🪙",   title: "hTOKEN is minted",       body: "Each token = 1 USDC of the forward contract" },
    { emoji: "💰",   title: "You invest USDC",        body: "Farmer receives working capital immediately" },
    { emoji: "🚚",   title: "Crop is delivered",      body: "Off-taker pays the protocol in USDC" },
    { emoji: "💸",   title: "You get repaid",         body: "Burn tokens, receive USDC + yield pro-rata" },
  ];
  return (
    <div className="mb-10">
      <h2 className="text-base font-bold text-gray-700 mb-4">How it works</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-harvest-cream p-4 flex flex-col items-center text-center gap-2">
            <span className="text-2xl">{s.emoji}</span>
            <p className="text-xs font-bold text-harvest-green">{s.title}</p>
            <p className="text-xs text-gray-400 leading-snug">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FarmerBanner({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-12 bg-harvest-cream rounded-3xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div>
        <p className="text-lg font-bold text-harvest-brown">Are you a farmer cooperative?</p>
        <p className="text-sm text-gray-600 mt-1 max-w-md">
          Tokenise your upcoming harvest and receive USDC working capital upfront —
          no bank, no loan shark, no collateral required.
        </p>
      </div>
      <button
        onClick={onClick}
        className="shrink-0 bg-harvest-green text-white font-bold px-7 py-3 rounded-full text-sm hover:opacity-90 transition whitespace-nowrap"
      >
        🌱 Register Your Harvest →
      </button>
    </div>
  );
}

export default function App() {
  const { authenticated } = usePrivy();
  const { contracts, isLoading } = useContracts();
  const [view, setView] = useState<View>("home");

  const active  = contracts.filter((c) => c.status === 0);
  const settled = contracts.filter((c) => c.status === 1);

  // Derived stats
  const totalRaised = contracts.reduce((sum, c) => sum + c.raisedAmount, 0n);
  const totalRaisedFmt = Number(formatUnits(totalRaised, 6)).toLocaleString("en-US", { maximumFractionDigits: 0 });

  // Estimated APY: (targetAmount - raisedAmount) / raisedAmount annualised over avg deadline
  // For the demo we show a fixed representative figure based on typical commodity forward premiums
  const avgApy = active.length > 0
    ? (() => {
        const avgDays = active.reduce((s, c) => {
          const daysLeft = Math.max(0, Math.floor((Number(c.deadline) - Date.now() / 1000) / 86400));
          return s + daysLeft;
        }, 0) / active.length;
        // Assume 12% annualised commodity forward premium
        const periodReturn = (12 / 365) * avgDays;
        return `~${periodReturn.toFixed(1)}%`;
      })()
    : "~8–15%";

  if (view === "register") {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Header />
        <main className="max-w-6xl mx-auto px-2 sm:px-3 py-6">
          <button
            onClick={() => setView("home")}
            className="text-sm text-harvest-green flex items-center gap-1 mb-6 hover:underline"
          >
            ← Back to investments
          </button>
          <RegisterPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header onRegister={() => setView("register")} />

      <main className="max-w-6xl mx-auto px-2 sm:px-3 py-8">
        <Hero
          onRegister={() => setView("register")}
          totalRaised={totalRaisedFmt}
          activeCount={active.length}
          avgApy={avgApy}
        />

        <HowItWorks />

        {/* Active rounds — always visible */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-700">
              🟢 Active Funding Rounds
              <span className="ml-2 text-xs font-semibold bg-harvest-green text-white px-2 py-0.5 rounded-full">
                {active.length} open
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-harvest-cream p-6 animate-pulse h-48" />
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="bg-white rounded-2xl border border-harvest-cream p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">🌾</p>
              <p className="font-medium">No active rounds yet.</p>
              <p className="text-sm mt-1">
                Be the first —{" "}
                <button onClick={() => setView("register")} className="text-harvest-green underline">
                  register a harvest →
                </button>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map((fc) => <ForwardContractCard key={String(fc.id)} fc={fc} />)}
            </div>
          )}
        </section>

        {/* Settled contracts */}
        {settled.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-gray-700 mb-4">✅ Settled Contracts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {settled.map((fc) => <ForwardContractCard key={String(fc.id)} fc={fc} />)}
            </div>
          </section>
        )}

        {!authenticated && (
          <div className="bg-white rounded-2xl border border-harvest-cream p-8 text-center mb-8">
            <p className="text-3xl mb-3">💰</p>
            <p className="font-bold text-harvest-brown text-lg">Ready to invest?</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">Connect your wallet to fund active rounds and start earning yield.</p>
          </div>
        )}

        <FarmerBanner onClick={() => setView("register")} />
      </main>
    </div>
  );
}
