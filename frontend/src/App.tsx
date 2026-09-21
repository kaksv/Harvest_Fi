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
    <div className="flex min-w-[120px] flex-col items-center bg-white/10 px-5 py-4">
      <p className="font-mono text-2xl font-bold tabular-nums text-white">{value}</p>
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
    <div className="relative mb-12 overflow-hidden bg-harvest-green px-6 py-10 text-left sm:px-10 sm:py-14">
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[42px] border-harvest-amber/20" aria-hidden="true" />
      <div className="relative max-w-3xl">
        <span className="mb-5 inline-flex border-l-2 border-harvest-amber pl-3 text-xs font-bold uppercase tracking-[0.18em] text-harvest-amber">
          Real-world harvest finance
        </span>
        <h1 className="max-w-2xl font-serif text-4xl font-bold leading-[1.04] text-white sm:text-6xl">
          Fund the harvest.<br />Share the upside.
        </h1>
        <p className="mb-9 mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
          Back verified coffee and vanilla harvests in Uganda with USDC. Funds stay in escrow until delivery; investors receive a transparent claim on settlement.
        </p>

        {/* Stats */}
        <div className="mb-9 grid max-w-2xl grid-cols-2 gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-4">
          <StatPill label="Total Raised"    value={`$${totalRaised}`} sub="USDC" />
          <StatPill label="Active Rounds"   value={String(activeCount)} />
          <StatPill label="Settlement premium" value={avgApy} sub="fixed term" />
          <StatPill label="Chain"           value="Base" sub="~$0.001 gas" />
        </div>

        {!authenticated ? (
          <button
            onClick={login}
            className="min-h-11 bg-harvest-amber px-6 py-3 text-sm font-bold text-harvest-brown shadow-lg transition-colors hover:bg-harvest-amber-light"
          >
            Connect wallet to invest
          </button>
        ) : (
          <button
            onClick={onRegister}
            className="min-h-11 border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Register your harvest
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
    { emoji: "💰",   title: "You invest USDC",        body: "Funds are held in protocol escrow" },
    { emoji: "🚚",   title: "Crop is delivered",      body: "Off-taker pays the protocol in USDC" },
    { emoji: "💸",   title: "You get repaid",         body: "Burn tokens, receive USDC + yield pro-rata" },
  ];
  return (
    <div className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-harvest-green/60">The model</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-harvest-brown">A better path from field to finance</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="border-t-2 border-harvest-green/20 bg-white/60 p-4 text-left">
            <span className="font-mono text-xs font-bold text-harvest-amber">0{i + 1}</span>
            <p className="mt-4 text-sm font-bold text-harvest-green">{s.title}</p>
            <p className="mt-2 text-xs leading-5 text-gray-500">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FarmerBanner({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-14 flex flex-col items-start justify-between gap-6 border-y border-harvest-brown/15 py-8 sm:flex-row sm:items-center">
      <div>
        <p className="font-serif text-2xl font-bold text-harvest-brown">Are you a farmer cooperative?</p>
        <p className="text-sm text-gray-600 mt-1 max-w-md">
          Tokenise your upcoming harvest and connect it to a verified off-taker —
          no bank, no loan shark, no traditional collateral required.
        </p>
      </div>
      <button
        onClick={onClick}
        className="min-h-11 shrink-0 bg-harvest-green px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-harvest-brown"
      >
        Register your harvest
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

  const avgApy = "12%";

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
    <div className="page-enter min-h-screen font-sans">
      <Header onRegister={() => setView("register")} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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
