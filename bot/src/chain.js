import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const account = privateKeyToAccount(process.env.BOT_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain:     baseSepolia,
  transport: http(process.env.RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain:     baseSepolia,
  transport: http(process.env.RPC_URL),
});

const POOL_ABI = parseAbi([
  "function createContractByWeight(string name_, string symbol_, uint256 weightGrams, uint256 deadline, string metadataCID) returns (uint256)",
]);

const POOL_ADDRESS = /** @type {`0x${string}`} */ (process.env.HARVEST_POOL_ADDRESS);

/**
 * Deploy a harvest forward contract on-chain on behalf of a cooperative.
 * @param {{ name: string, symbol: string, weightGrams: number, deadlineDays: number, cid: string }} params
 * @returns {Promise<{ txHash: string, contractId: bigint }>}
 */
export async function createHarvestContract({ name, symbol, weightGrams, deadlineDays, cid }) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineDays * 86_400);

  const txHash = await walletClient.writeContract({
    address:      POOL_ADDRESS,
    abi:          POOL_ABI,
    functionName: "createContractByWeight",
    args:         [name, symbol, BigInt(weightGrams), deadline, cid],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Parse ContractCreated event to get the ID
  const log = receipt.logs.find((l) => l.topics.length > 1);
  const contractId = log ? BigInt(log.topics[1]) : 0n;

  return { txHash, contractId };
}
