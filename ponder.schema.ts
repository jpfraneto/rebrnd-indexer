import { onchainTable } from "ponder";

// Comprehensive auction tracking
export const auction = onchainTable("auction", (t) => ({
  id: t.text().primaryKey(), // castHash
  castHash: t.hex().notNull(),
  creator: t.hex().notNull(),
  creatorFid: t.bigint().notNull(),
  state: t.integer().notNull(), // 0=None, 1=Active, 2=Ended, 3=Settled, 4=Cancelled, 5=Recovered
  // Auction parameters
  minBid: t.bigint().notNull(),
  minBidIncrementBps: t.integer().notNull(),
  protocolFeeBps: t.integer().notNull(),
  duration: t.integer().notNull(),
  extension: t.integer().notNull(),
  extensionThreshold: t.integer().notNull(),
  // Timing
  startTime: t.bigint().notNull(),
  endTime: t.bigint().notNull(),
  lastBidAt: t.bigint(),
  // Current highest bid info
  highestBidder: t.hex(),
  highestBidderFid: t.bigint(),
  highestBid: t.bigint(),
  totalBids: t.integer().notNull().default(0),
  // Settlement info
  settledAt: t.bigint(),
  treasuryAmount: t.bigint(),
  creatorAmount: t.bigint(),
  // Block info
  startBlockNumber: t.bigint().notNull(),
  startTransactionHash: t.hex().notNull(),
}));

// Individual bids tracking
export const bid = onchainTable("bid", (t) => ({
  id: t.text().primaryKey(), // castHash-bidIndex
  castHash: t.hex().notNull(),
  bidder: t.hex().notNull(),
  bidderFid: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  bidIndex: t.integer().notNull(), // Order of this bid in the auction
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
  authorizer: t.hex().notNull(),
  wasRefunded: t.boolean().notNull().default(false),
  refundedAt: t.bigint(),
}));

// Auction extensions tracking
export const auctionExtension = onchainTable("auction_extension", (t) => ({
  id: t.text().primaryKey(), // castHash-extensionIndex
  castHash: t.hex().notNull(),
  oldEndTime: t.bigint().notNull(),
  newEndTime: t.bigint().notNull(),
  extensionIndex: t.integer().notNull(),
  triggeredBy: t.hex().notNull(), // bidder who triggered extension
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

// User statistics
export const userStats = onchainTable("user_stats", (t) => ({
  id: t.text().primaryKey(), // user address
  address: t.hex().notNull(),
  fid: t.bigint(),
  // As creator
  totalAuctionsCreated: t.integer().notNull().default(0),
  totalCreatorEarnings: t.bigint().notNull().default(0n),
  successfulAuctions: t.integer().notNull().default(0),
  // As bidder
  totalBidsPlaced: t.integer().notNull().default(0),
  totalAmountBid: t.bigint().notNull().default(0n),
  auctionsWon: t.integer().notNull().default(0),
  totalAmountWon: t.bigint().notNull().default(0n),
  auctionsLost: t.integer().notNull().default(0),
  // Timing
  firstActivityAt: t.bigint(),
  lastActivityAt: t.bigint(),
}));

// Daily aggregated stats
export const dailyStats = onchainTable("daily_stats", (t) => ({
  id: t.text().primaryKey(), // YYYY-MM-DD
  date: t.text().notNull(),
  timestamp: t.bigint().notNull(), // Start of day timestamp
  // Auction activity
  auctionsStarted: t.integer().notNull().default(0),
  auctionsSettled: t.integer().notNull().default(0),
  auctionsCancelled: t.integer().notNull().default(0),
  // Bidding activity
  totalBids: t.integer().notNull().default(0),
  totalVolume: t.bigint().notNull().default(0n),
  uniqueBidders: t.integer().notNull().default(0),
  uniqueCreators: t.integer().notNull().default(0),
  // Protocol metrics
  protocolFees: t.bigint().notNull().default(0n),
  averageAuctionDuration: t.bigint(),
  medianBidAmount: t.bigint(),
  highestBid: t.bigint(),
}));

// Cast collectible metadata (for brnd filtering)
export const castCollectible = onchainTable("cast_collectible", (t) => ({
  id: t.text().primaryKey(), // castHash
  castHash: t.hex().notNull(),
  creator: t.hex().notNull(),
  creatorFid: t.bigint().notNull(),
  winner: t.hex(),
  winnerFid: t.bigint(),
  finalAmount: t.bigint(),
  isFromBrndbot: t.boolean().notNull().default(false),
  settledAt: t.bigint(),
  blockNumber: t.bigint(),
  transactionHash: t.hex(),
}));

// BRND collectors (legacy table for backward compatibility)
export const brndCollector = onchainTable("brnd_collector", (t) => ({
  id: t.text().primaryKey(), // winner address
  winner: t.hex().notNull(),
  winnerFid: t.bigint().notNull(),
  totalCollected: t.integer().notNull().default(0),
  totalAmountSpent: t.bigint().notNull().default(0n),
  firstCollectionTimestamp: t.bigint().notNull(),
  lastCollectionTimestamp: t.bigint().notNull(),
}));

// Auction settled events (legacy table for backward compatibility)
export const auctionSettled = onchainTable("auction_settled", (t) => ({
  id: t.text().primaryKey(), // castHash
  castHash: t.hex().notNull(),
  winner: t.hex().notNull(),
  winnerFid: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));
