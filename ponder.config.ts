import { createConfig } from "ponder";

import { StoriesInMotionV8Abi } from "./abis/StoriesInMotionV8Abi";

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
      abi: StoriesInMotionV8Abi,
      address: process.env.CONTRACT_ADDRESS as `0x${string}`,
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
  },
});
