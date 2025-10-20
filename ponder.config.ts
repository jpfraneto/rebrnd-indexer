import { createConfig } from "ponder";

import { AuctionAbi } from "./abis/AuctionAbi";

console.log("RPC URL from env:", process.env.PONDER_RPC_URL_8453);

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  chains: {
    base: { id: 8453, rpc: process.env.PONDER_RPC_URL_8453 },
  },
  contracts: {
    Auction: {
      abi: AuctionAbi,
      address: "0xFC52e33F48Dd3fcd5EE428c160722efda645D74A",
      chain: "base",
      startBlock: 33200648,
    },
  },
});
