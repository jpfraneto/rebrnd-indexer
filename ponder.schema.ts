import { onchainTable } from "ponder";

export const brands = onchainTable("brands", (t) => ({
  id: t.integer().primaryKey(),
  fid: t.integer().notNull(),
  walletAddress: t.text().notNull(),
  handle: t.text().notNull(),
  metadataHash: t.text().notNull(),
  totalBrndAwarded: t.bigint().notNull(),
  availableBrnd: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const votes = onchainTable("votes", (t) => ({
  id: t.text().primaryKey(),
  voter: t.text().notNull(),
  fid: t.integer().notNull(),
  day: t.bigint().notNull(),
  brandIds: t.text().notNull(), // JSON array of brand IDs [1,2,3]
  cost: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const users = onchainTable("users", (t) => ({
  fid: t.integer().primaryKey(),
  brndPowerLevel: t.integer().notNull(),
  totalVotes: t.integer().notNull(),
  lastVoteDay: t.integer(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const walletAuthorizations = onchainTable("wallet_authorizations", (t) => ({
  id: t.text().primaryKey(),
  fid: t.integer().notNull(),
  wallet: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const rewardClaims = onchainTable("reward_claims", (t) => ({
  id: t.text().primaryKey(),
  recipient: t.text().notNull(),
  fid: t.integer().notNull(),
  amount: t.bigint().notNull(),
  day: t.bigint().notNull(),
  castHash: t.text().notNull(),
  caller: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const brandRewardWithdrawals = onchainTable("brand_reward_withdrawals", (t) => ({
  id: t.text().primaryKey(),
  brandId: t.integer().notNull(),
  fid: t.integer().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const brndPowerLevelUps = onchainTable("brnd_power_level_ups", (t) => ({
  id: t.text().primaryKey(),
  fid: t.integer().notNull(),
  newLevel: t.integer().notNull(),
  wallet: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));
