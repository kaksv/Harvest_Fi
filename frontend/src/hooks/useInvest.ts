import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { HARVEST_POOL_ABI, ERC20_ABI } from "../lib/abis";
import { POOL_ADDRESS, USDC_ADDRESS } from "../lib/wagmi";

export function useInvest() {
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, data: receipt, writeContractAsync: _, ...rest } = { isLoading: false, data: null, writeContractAsync: null, ...{} };

  async function invest(contractId: bigint, amountUsdc: bigint) {
    // Step 1: approve
    const approveTx = await writeContractAsync({
      address:      USDC_ADDRESS,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [POOL_ADDRESS, amountUsdc],
    });

    // Step 2: invest
    const investTx = await writeContractAsync({
      address:      POOL_ADDRESS,
      abi:          HARVEST_POOL_ABI,
      functionName: "invest",
      args:         [contractId, amountUsdc],
    });

    return { approveTx, investTx };
  }

  return { invest, isWriting };
}
