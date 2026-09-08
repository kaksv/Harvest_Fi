# 🌱 HarvestFi

> **Tokenised crop forwards on Base. Ugandan farmers get USDC upfront. Investors earn yield. No banks. 🌱**

HarvestFi is a decentralised trade finance protocol that tokenises forward contracts for Ugandan cash crops — starting with coffee and vanilla. Farmer cooperatives register their expected harvest on-chain, receive working capital from global investors immediately, and repay them when the crop is delivered to a verified agro-processor.

---

## The Problem

Ugandan smallholder farmers face a brutal liquidity trap:

- They are forced to sell at **harvest time** when prices are at their **lowest** because they need cash immediately
- Prices are highest **months later** when global demand peaks — but farmers have no way to hold out
- Banks **refuse to lend** to them due to lack of traditional collateral
- The alternative is **predatory loan sharks** charging 30–50% interest

## The Solution

HarvestFi lets cooperatives **tokenise their future harvest** as a Real World Asset (RWA):

1. 🧑🌾 **Cooperative** registers their expected yield (e.g. 500kg of Grade A Arabica Coffee) and deploys a forward contract on Base
2. 🪙 **Protocol** mints `hTOKENs` (e.g. `hCOFFEE`) — each token represents a proportional claim on the future delivery
3. 💰 **Investors** buy hTOKENs with USDC — the farmer receives that capital **immediately**, the same block
4. 🚚 **Off-taker** (agro-processor) receives the physical crop at delivery and settles the contract in USDC
5. 💸 **Investors** burn their hTOKENs and receive USDC pro-rata — principal + yield (~12% APY)

**Farmer wins time. Investor wins yield. Off-taker wins guaranteed supply.**

---

## Live Deployment — Base Sepolia

| Contract | Address |
|---|---|
| `HarvestPool` | [`0xbec63Dd50093Bc9E7fF57aBa60aBB96d164C74a1`](https://sepolia.basescan.org/address/0xbec63dd50093bc9e7ff57aba60abb96d164c74a1) |
| `CropPriceOracle` | [`0x7f56A85F2B53969af5679c1Ba479C3944c5a27d9`](https://sepolia.basescan.org/address/0x7f56a85f2b53969af5679c1ba479c3944c5a27d9) |
| USDC (Base Sepolia) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

### Demo Contracts (Live)

| # | Cooperative | Crop | Target | Deadline |
|---|---|---|---|---|
| 1 | Bugisu Cooperative Union | ☕ Coffee (500kg) | $2,500 USDC | 90 days |
| 2 | Mt. Elgon Vanilla Farmers SACCO | 🌿 Vanilla (100kg) | $3,000 USDC | 60 days |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      HarvestPool.sol                    │
│                                                         │
│  createContract()  ──►  deploys HarvestToken (ERC-20)   │
│  invest()          ──►  mints hTOKENs, forwards USDC    │
│                         to cooperative immediately      │
│  settle()          ──►  off-taker pays USDC into escrow │
│  redeem()          ──►  burns hTOKENs, releases USDC    │
└────────────────────────────┬────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
   ┌──────────▼──────────┐    ┌─────────────▼────────────┐
   │   HarvestToken.sol  │    │   CropPriceOracle.sol     │
   │                     │    │                           │
   │  ERC-20 + Permit    │    │  Chainlink feed wrapper   │
   │  mint/burn by pool  │    │  weightGrams → USDC quote │
   └─────────────────────┘    └───────────────────────────┘
```

### Contract Lifecycle

```
Status: Funding ──► Settled
                └──► Cancelled (admin, post-deadline)
```

| Status | Description |
|---|---|
| `Funding` | Accepting investments, USDC flows to cooperative immediately |
| `Settled` | Off-taker has paid, investors can redeem |
| `Cancelled` | Admin cancelled post-deadline, no new investments |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Chain | [Base](https://base.org) (Sepolia testnet) |
| Smart Contracts | Solidity 0.8.25 + [Foundry](https://book.getfoundry.sh) |
| Token Standard | ERC-20 + ERC20Permit (OpenZeppelin v5) |
| Price Oracle | [Chainlink AggregatorV3](https://docs.chain.link) |
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Wallet / Auth | [Privy](https://privy.io) (email, Google, embedded wallets) |
| Chain Reads/Writes | [Wagmi v2](https://wagmi.sh) + [viem](https://viem.sh) |
| GPS / Geocoding | Browser Geolocation API + [Nominatim](https://nominatim.openstreetmap.org) |
| WhatsApp Bot | Node.js + Twilio (built, pending deployment) |
| IPFS | [Pinata](https://pinata.cloud) (integrated, metadata stored inline for demo) |

---

## Project Structure

```
HarvestFi/
├── src/
│   ├── HarvestPool.sol          # Core escrow & lifecycle logic
│   ├── HarvestToken.sol         # ERC-20 + ERC20Permit harvest token
│   └── CropPriceOracle.sol      # Chainlink weight → USDC converter
├── test/
│   └── HarvestPool.t.sol        # 6 lifecycle tests (all passing)
├── script/
│   └── DeployHarvestPool.s.sol  # Foundry deploy script (Base Sepolia)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Header.tsx               # Nav + wallet connect
│       │   ├── ForwardContractCard.tsx  # Investment card with APY + return calc
│       │   └── RegisterPage.tsx         # 6-step farmer registration form
│       ├── hooks/
│       │   ├── useContracts.ts    # Reads all forward contracts on-chain
│       │   ├── useInvest.ts       # Approve USDC + invest flow
│       │   ├── useRegister.ts     # createContractByWeight call
│       │   └── useGeoLocation.ts  # Browser GPS + Nominatim reverse geocode
│       └── lib/
│           ├── abis.ts            # Minimal contract ABIs
│           └── wagmi.ts           # Wagmi config (Base Sepolia)
└── bot/
    └── src/
        ├── index.js     # Express + Twilio webhook
        ├── handler.js   # Multi-step WhatsApp conversation
        ├── chain.js     # viem on-chain writer
        ├── pinata.js    # IPFS metadata upload
        └── session.js   # In-memory session store
```

---

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org) v18+
- A wallet with Base Sepolia ETH ([faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))
- Base Sepolia USDC ([Circle faucet](https://faucet.circle.com))

### 1. Clone & Install

```bash
git clone https://github.com/your-username/harvestfi
cd HarvestFi
forge install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Fill in your values — see .env.example for all required vars
```

### 3. Run Tests

```bash
forge test -vv
```

```
Ran 6 tests for test/HarvestPool.t.sol:HarvestPoolTest
[PASS] test_cancel_afterDeadline()
[PASS] test_createContract()
[PASS] test_invest_mintsTokensAndForwardsFunds()
[PASS] test_revert_overfund()
[PASS] test_revert_redeemBeforeSettled()
[PASS] test_settle_and_redeem()
Suite result: ok. 6 passed; 0 failed
```

### 4. Deploy

```bash
forge script script/DeployHarvestPool.s.sol:DeployHarvestPool \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

### 5. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

---

## The Full Settlement Loop

This is the complete lifecycle of a forward contract, demonstrating the end-to-end flow:

**Step 1 — Create a contract (Cooperative)**
```bash
cast send $POOL \
  "createContract(string,string,uint256,uint256,string)" \
  "Harvest Coffee 2025-Q4" "hCOFFEE" "2500000000" "$DEADLINE" "$METADATA" \
  --private-key $COOP_KEY --rpc-url $RPC
```

**Step 2 — Invest (Investor)**
```bash
# Approve USDC
cast send $USDC "approve(address,uint256)" $POOL 500000000 \
  --private-key $INVESTOR_KEY --rpc-url $RPC

# Invest $500 into contract #1
cast send $POOL "invest(uint256,uint256)" 1 500000000 \
  --private-key $INVESTOR_KEY --rpc-url $RPC
```

**Step 3 — Settle (Off-taker, after physical delivery)**
```bash
cast send $USDC "approve(address,uint256)" $POOL 500000000 \
  --private-key $OFFTAKER_KEY --rpc-url $RPC

cast send $POOL "settle(uint256,uint256)" 1 500000000 \
  --private-key $OFFTAKER_KEY --rpc-url $RPC
```

**Step 4 — Redeem (Investor)**
```bash
cast send $POOL "redeem(uint256,uint256)" 1 500000000 \
  --private-key $INVESTOR_KEY --rpc-url $RPC
```

---

## Key Design Decisions

**Why does the farmer get USDC immediately on invest?**
The whole purpose is upfront working capital. The farmer receives funds the same block an investor commits — there is no lockup period. Settlement is purely the investor repayment mechanism.

**Why Base?**
Near-zero gas (~$0.001/tx), native USDC, Coinbase on/off-ramps, and strong hackathon ecosystem support. Critically, fees are low enough that a Ugandan cooperative can afford to register a contract.

**Why Privy?**
Farmers and impact investors in emerging markets are not crypto-native. Privy's embedded wallets allow login with just an email address — no seed phrases, no MetaMask, no friction.

**Why inline JSON instead of IPFS CIDs?**
For the hackathon demo, metadata is stored as an inline JSON string in the `metadataCID` field. This removes the Pinata dependency and keeps the demo self-contained. The field name and architecture are ready for real IPFS CIDs in production — it's a one-line change.

**Why ETH/USD as the coffee price feed?**
Chainlink does not yet have a native coffee commodity feed on Base Sepolia. The oracle architecture is designed so that a real feed — sourced via a Chainlink External Adapter pointing to ICO coffee price data — can be swapped in by calling `setOracle("hCOFFEE", newAddress)` with zero contract redeployment.

---

## Roadmap

- [ ] Real Chainlink commodity price feed via External Adapter
- [ ] IPFS proof-of-farm uploads via Pinata
- [ ] WhatsApp bot deployment (Africa's Talking / Meta Cloud API)
- [ ] Investor portfolio view with hTOKEN balances + redeem UI
- [ ] Verified off-taker registry (`mapping(address => bool)`)
- [ ] Gnosis Safe multisig for admin functions
- [ ] Security audit
- [ ] Base Mainnet deployment

---

## Actors

| Actor | Role |
|---|---|
| **Cooperative** | Registers harvest, receives USDC upfront, delivers crop |
| **Investor** | Buys hTOKENs with USDC, earns yield at settlement |
| **Off-taker** | Verified agro-processor (e.g. Ugacof, Kyagalanyi Coffee) who buys the physical crop and settles on-chain |
| **Admin** | Deploys oracles, manages verified feeds, can cancel expired rounds |

---

## License

MIT
