import { createConfig } from "ponder";

import { UnverifiedContractAbi } from "./abis/UnverifiedContractAbi";

export default createConfig({
  chains: {
    basePreconf: { id: 8453, rpc: "http(process.env.PONDER_RPC_URL_8453)" },
  },
  contracts: {
    UnverifiedContract: {
      abi: UnverifiedContractAbi,
      address: "0xfc52e33f48dd3fcd5ee428c160722efda645d74a",
      chain: "basePreconf",
    },
  },
});
