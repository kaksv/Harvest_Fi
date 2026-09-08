import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { createConfig } from "@privy-io/wagmi";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
});

export const POOL_ADDRESS = import.meta.env.VITE_HARVEST_POOL_ADDRESS as `0x${string}`;
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS as `0x${string}`;
