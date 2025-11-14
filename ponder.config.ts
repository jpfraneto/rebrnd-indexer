import { createConfig } from "ponder";

import { StoriesInMotionV5Abi } from "./abis/StoriesInMotionV5Abi";

export default createConfig({
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453!,
    },
  },
  contracts: {
    StoriesInMotionV5: {
      chain: "base",
      abi: StoriesInMotionV5Abi,
      address: process.env.CONTRACT_ADDRESS!,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
  },
});
