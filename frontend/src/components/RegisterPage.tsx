import { useState } from "react";
import { useRegister, type RegisterParams } from "../hooks/useRegister";
import { useGeoLocation } from "../hooks/useGeoLocation";

const CROPS = [
  { name: "Coffee",  symbol: "hCOFFEE",  emoji: "☕" },
  { name: "Vanilla", symbol: "hVANILLA", emoji: "🌿" },
];

type Step = "cooperative" | "crop" | "weight" | "deadline" | "gps" | "confirm" | "done";

const STEPS: Step[] = ["cooperative", "crop", "weight", "deadline", "gps", "confirm", "done"];

function StepIndicator({ current }: { current: Step }) {
  const labels = ["Cooperative", "Crop", "Weight", "Deadline", "Location", "Confirm"];
  const idx    = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1 mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1">
          <div className={`flex-1 h-1 rounded-full ${i < idx ? "bg-harvest-green" : "bg-gray-200"}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            ${i < idx  ? "bg-harvest-green text-white" : ""}
            ${i === idx ? "bg-harvest-amber text-harvest-brown ring-2 ring-harvest-amber ring-offset-1" : ""}
            ${i > idx  ? "bg-gray-200 text-gray-400" : ""}
          `}>
            {i < idx ? "✓" : i + 1}
          </div>
          {i < labels.length - 1 && (
            <div className={`flex-1 h-1 rounded-full ${i < idx - 1 ? "bg-harvest-green" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-harvest-cream p-8 max-w-lg mx-auto">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-gray-700 mb-2">{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-harvest-green"
    />
  );
}

function NextBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full mt-6 bg-harvest-green text-white py-3 rounded-xl font-semibold text-sm hover:bg-opacity-90 transition disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function RegisterPage() {
  const { register, isPending } = useRegister();

  const [step, setStep]               = useState<Step>("cooperative");
  const [cooperative, setCooperative] = useState("");
  const [crop, setCrop]               = useState(CROPS[0]);
  const [weightKg, setWeightKg]       = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");
  const [gps, setGps]                 = useState("");
  const [gpsAddress, setGpsAddress]   = useState("");
  const [txHash, setTxHash]           = useState("");
  const [error, setError]             = useState("");
  const geo                           = useGeoLocation();

  function next() { setStep(STEPS[STEPS.indexOf(step) + 1]); }

  async function submit() {
    setError("");
    try {
      const params: RegisterParams = {
        cooperative,
        crop,
        weightKg:     parseInt(weightKg),
        deadlineDays: parseInt(deadlineDays),
        gps,
      };
      const { txHash: hash } = await register(params);
      setTxHash(hash);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-3xl mb-1">🧑‍🌾</p>
        <h2 className="text-xl font-bold text-harvest-brown">Register Your Harvest</h2>
        <p className="text-sm text-gray-500 mt-1">Tokenise your future crop and receive working capital upfront</p>
      </div>

      {step !== "done" && <StepIndicator current={step} />}

      {/* ── Step 1: Cooperative name ── */}
      {step === "cooperative" && (
        <Card>
          <Label>What is the name of your cooperative?</Label>
          <Input
            placeholder="e.g. Bugisu Cooperative Union"
            value={cooperative}
            onChange={(e) => setCooperative(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">This will be recorded on-chain as the contract creator.</p>
          <NextBtn onClick={next} disabled={!cooperative.trim()}>Continue →</NextBtn>
        </Card>
      )}

      {/* ── Step 2: Crop type ── */}
      {step === "crop" && (
        <Card>
          <Label>Which crop are you registering?</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {CROPS.map((c) => (
              <button
                key={c.symbol}
                onClick={() => setCrop(c)}
                className={`border-2 rounded-xl p-4 text-left transition
                  ${crop.symbol === c.symbol
                    ? "border-harvest-green bg-harvest-cream"
                    : "border-gray-200 hover:border-harvest-green"
                  }`}
              >
                <p className="text-2xl mb-1">{c.emoji}</p>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-gray-400">{c.symbol}</p>
              </button>
            ))}
          </div>
          <NextBtn onClick={next}>Continue →</NextBtn>
        </Card>
      )}

      {/* ── Step 3: Weight ── */}
      {step === "weight" && (
        <Card>
          <Label>How many kilograms of {crop.name} are you pledging?</Label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 500"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">
            The USDC target is calculated automatically from the current market price via Chainlink.
          </p>
          <NextBtn onClick={next} disabled={!weightKg || parseInt(weightKg) <= 0}>Continue →</NextBtn>
        </Card>
      )}

      {/* ── Step 4: Deadline ── */}
      {step === "deadline" && (
        <Card>
          <Label>How many days until harvest delivery?</Label>
          <Input
            type="number"
            min="7"
            placeholder="e.g. 90"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">Minimum 7 days. Investors have until this deadline to fund the contract.</p>
          <NextBtn onClick={next} disabled={!deadlineDays || parseInt(deadlineDays) < 7}>Continue →</NextBtn>
        </Card>
      )}

      {/* ── Step 5: GPS ── */}
      {step === "gps" && (
        <Card>
          <Label>📍 Farm Location</Label>

          {/* Auto-detect button */}
          {geo.state.status !== "ok" && (
            <button
              onClick={geo.locate}
              disabled={geo.state.status === "locating"}
              className="w-full flex items-center justify-center gap-2 border-2 border-harvest-green text-harvest-green rounded-xl py-3 font-semibold text-sm hover:bg-harvest-cream transition disabled:opacity-50 mb-4"
            >
              {geo.state.status === "locating" ? (
                <><span className="animate-spin">⏳</span> Detecting location…</>
              ) : (
                <><span>📡</span> Use My Current Location</>
              )}
            </button>
          )}

          {/* Success state */}
          {geo.state.status === "ok" && (
            <div className="bg-harvest-cream rounded-xl p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Detected location</p>
                  <p className="text-sm font-semibold text-harvest-brown leading-snug">{geo.state.result.address}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{geo.state.result.coords}</p>
                </div>
                <button onClick={() => { geo.reset(); setGps(""); setGpsAddress(""); }} className="text-xs text-gray-400 hover:text-red-400 ml-3 shrink-0">✕ Clear</button>
              </div>
            </div>
          )}

          {/* Error from geolocation */}
          {geo.state.status === "error" && (
            <p className="text-xs text-red-500 mb-3">{geo.state.message}</p>
          )}

          {/* Manual fallback */}
          {geo.state.status !== "ok" && (
            <>
              <p className="text-xs text-gray-400 mb-2 text-center">— or enter manually —</p>
              <Input
                placeholder="e.g. 1.0456, 34.1234"
                value={gps}
                onChange={(e) => setGps(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Latitude, Longitude · Don't know your coordinates?{" "}
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-harvest-green underline"
                >
                  Find on Google Maps →
                </a>
              </p>
            </>
          )}

          <NextBtn
            onClick={() => {
              if (geo.state.status === "ok") {
                setGps(geo.state.result.coords);
                setGpsAddress(geo.state.result.address);
              }
              next();
            }}
            disabled={geo.state.status === "locating" || (geo.state.status !== "ok" && !gps.trim())}
          >
            Continue →
          </NextBtn>
        </Card>
      )}

      {/* ── Step 6: Confirm ── */}
      {step === "confirm" && (
        <Card>
          <p className="text-base font-bold text-harvest-brown mb-4">Review your contract</p>
          <div className="space-y-3 text-sm">
            {[
              ["🏢 Cooperative",   cooperative],
              ["🌱 Crop",          `${crop.emoji} ${crop.name} (${crop.symbol})`],
              ["⚖️ Weight",        `${weightKg} kg`],
              ["📅 Delivery in",   `${deadlineDays} days`],
              ["📍 Location",       gpsAddress || gps],
              ["🗺️ Coordinates",    gps],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-right max-w-[200px] truncate">{value}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-500 mt-4 break-words">{error}</p>}

          <NextBtn onClick={submit} disabled={isPending}>
            {isPending ? "Publishing on Base…" : "🚀 Publish Contract On-Chain"}
          </NextBtn>
          <button
            onClick={() => setStep("gps")}
            className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Edit
          </button>
        </Card>
      )}

      {/* ── Step 7: Done ── */}
      {step === "done" && (
        <Card>
          <div className="text-center">
            <p className="text-5xl mb-3">🎉</p>
            <h3 className="text-lg font-bold text-harvest-green mb-1">Contract Published!</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your harvest forward contract is live on Base Sepolia. Investors can now fund it.
            </p>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-mono bg-harvest-cream text-harvest-green px-4 py-2 rounded-lg hover:underline break-all"
            >
              View on Basescan →
            </a>
            <button
              onClick={() => {
                setStep("cooperative");
                setCooperative(""); setWeightKg(""); setDeadlineDays(""); setGps("");
              }}
              className="w-full mt-6 border border-harvest-green text-harvest-green py-3 rounded-xl font-semibold text-sm hover:bg-harvest-cream transition"
            >
              Register Another Harvest
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
