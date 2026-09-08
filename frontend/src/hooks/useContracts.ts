import { useReadContract, useReadContracts } from "wagmi";
import { HARVEST_POOL_ABI } from "../lib/abis";
import { POOL_ADDRESS } from "../lib/wagmi";

export type ForwardContract = {
  id:           bigint;
  cooperative:  string;
  token:        string;
  targetAmount: bigint;
  raisedAmount: bigint;
  settledAmount:bigint;
  deadline:     bigint;
  metadataCID:  string;
  status:       number;
};

export function useContracts() {
  const { data: nextId } = useReadContract({
    address: POOL_ADDRESS,
    abi:     HARVEST_POOL_ABI,
    functionName: "nextId",
  });

  const ids = nextId ? Array.from({ length: Number(nextId) }, (_, i) => BigInt(i)) : [];

  const { data: rawList, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      address:      POOL_ADDRESS,
      abi:          HARVEST_POOL_ABI,
      functionName: "contracts" as const,
      args:         [id] as const,
    })),
  });

  const contracts: ForwardContract[] = (rawList ?? [])
    .map((r, i) => {
      if (r.status !== "success") return null;
      const [cooperative, token, targetAmount, raisedAmount, settledAmount, deadline, metadataCID, status] = r.result as [string, string, bigint, bigint, bigint, bigint, string, number];
      return { id: ids[i], cooperative, token, targetAmount, raisedAmount, settledAmount, deadline, metadataCID, status };
    })
    .filter(Boolean) as ForwardContract[];

  return { contracts, isLoading };
}
