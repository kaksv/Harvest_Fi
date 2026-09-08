export const HARVEST_POOL_ABI = [
  // read
  {
    name: "contracts",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      { name: "cooperative",    type: "address" },
      { name: "token",          type: "address" },
      { name: "targetAmount",   type: "uint256" },
      { name: "raisedAmount",   type: "uint256" },
      { name: "settledAmount",  type: "uint256" },
      { name: "deadline",       type: "uint256" },
      { name: "metadataCID",    type: "string"  },
      { name: "status",         type: "uint8"   },
    ],
  },
  {
    name: "nextId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // write
  {
    name: "createContractByWeight",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name_",        type: "string"  },
      { name: "symbol_",      type: "string"  },
      { name: "weightGrams",  type: "uint256" },
      { name: "deadline",     type: "uint256" },
      { name: "metadataCID",  type: "string"  },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    name: "invest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id",     type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "redeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id",          type: "uint256" },
      { name: "tokenAmount", type: "uint256" },
    ],
    outputs: [],
  },
  // events
  {
    name: "ContractCreated",
    type: "event",
    inputs: [
      { name: "id",          type: "uint256", indexed: true },
      { name: "cooperative", type: "address", indexed: true },
      { name: "token",       type: "address", indexed: false },
      { name: "targetAmount",type: "uint256", indexed: false },
      { name: "deadline",    type: "uint256", indexed: false },
    ],
  },
  {
    name: "Invested",
    type: "event",
    inputs: [
      { name: "id",       type: "uint256", indexed: true },
      { name: "investor", type: "address", indexed: true },
      { name: "amount",   type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
