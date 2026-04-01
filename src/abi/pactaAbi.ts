/** Pacta 合约 ABI（读写所需子集，与部署 ABI 一致） */
export const pactaAbi = [
  {
    inputs: [],
    name: "pactCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRewardPool",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "pactId", type: "uint256" }],
    name: "getPact",
    outputs: [
      {
        components: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "string", name: "habitName", type: "string" },
          { internalType: "uint256", name: "stakeAmount", type: "uint256" },
          { internalType: "uint256", name: "frequency", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "lastCheckin", type: "uint256" },
          { internalType: "uint256", name: "durationDays", type: "uint256" },
          { internalType: "bool", name: "completed", type: "bool" },
        ],
        internalType: "struct Pacta.Pact",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "habitName", type: "string" },
      { internalType: "uint256", name: "frequency", type: "uint256" },
      { internalType: "uint256", name: "durationDays", type: "uint256" },
    ],
    name: "createPact",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "pactId", type: "uint256" }],
    name: "checkin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "pactId", type: "uint256" }],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
