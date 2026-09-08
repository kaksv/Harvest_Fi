import { useWriteContract } from "wagmi";
import { HARVEST_POOL_ABI } from "../lib/abis";
import { POOL_ADDRESS } from "../lib/wagmi";

export type RegisterParams = {
  cooperative: string;
  crop:        { name: string; symbol: string };
  weightKg:    number;
  deadlineDays:number;
  gps:         string;
};

export function useRegister() {
  const { writeContractAsync, isPending } = useWriteContract();

  async function register(params: RegisterParams): Promise<{ txHash: string; contractId: string }> {
    const { cooperative, crop, weightKg, deadlineDays, gps } = params;

    const name       = `Harvest ${crop.name} ${new Date().getFullYear()}`;
    const symbol     = crop.symbol;
    const weightGrams = BigInt(weightKg * 1000);
    const deadline   = BigInt(Math.floor(Date.now() / 1000) + deadlineDays * 86_400);
    // Encode metadata as a simple JSON string stored as the CID field for the demo
    // (replace with real Pinata upload when available)
    const metadataCID = JSON.stringify({ cooperative, crop: crop.name, weightKg, gps, ts: Date.now() });

    const txHash = await writeContractAsync({
      address:      POOL_ADDRESS,
      abi:          HARVEST_POOL_ABI,
      functionName: "createContractByWeight",
      args:         [name, symbol, weightGrams, deadline, metadataCID],
    });

    return { txHash, contractId: "pending" };
  }

  return { register, isPending };
}
