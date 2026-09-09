import { usePrivy } from "@privy-io/react-auth";

type Props = { onRegister?: () => void };

export function Header({ onRegister }: Props) {
  const { ready, authenticated, login, logout, user } = usePrivy();

  const addr  = user?.wallet?.address;
  const short = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : null;

  return (
    <header className="border-b border-harvest-green/10 bg-harvest-green text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-harvest-amber text-lg text-harvest-brown" aria-hidden="true">✦</span>
        <div>
          <h1 className="font-serif text-xl font-bold tracking-tight">HarvestFi</h1>
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">Crop forwards · Base Sepolia</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRegister && (
          <button
            onClick={onRegister}
            className="hidden min-h-10 border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/20 sm:block"
          >
            Register a harvest
          </button>
        )}

        {!ready ? null : authenticated ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-mono text-white/70 sm:inline">{short}</span>
            <button
              onClick={logout}
              className="min-h-10 border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="min-h-10 bg-harvest-amber px-5 py-2 text-sm font-bold text-harvest-brown transition-colors hover:bg-harvest-amber-light"
          >
            Connect Wallet
          </button>
        )}
      </div>
      </div>
    </header>
  );
}
