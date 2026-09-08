import { usePrivy } from "@privy-io/react-auth";

type Props = { onRegister?: () => void };

export function Header({ onRegister }: Props) {
  const { ready, authenticated, login, logout, user } = usePrivy();

  const addr  = user?.wallet?.address;
  const short = addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : null;

  return (
    <header className="bg-harvest-green text-white px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌱</span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">HarvestFi</h1>
          <p className="text-xs opacity-75">Tokenised Crop Forwards · Base Sepolia</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRegister && (
          <button
            onClick={onRegister}
            className="hidden sm:block text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-1.5 rounded-full transition"
          >
            🧑🌾 Register Harvest
          </button>
        )}

        {!ready ? null : authenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono bg-white/10 px-3 py-1 rounded-full">{short}</span>
            <button
              onClick={logout}
              className="text-sm bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="text-sm bg-harvest-amber text-harvest-brown font-semibold px-5 py-2 rounded-full hover:opacity-90 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
