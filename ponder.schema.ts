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
  points: t.bigint().notNull().default(0n), // Cumulative total points
  lastVoteDay: t.integer(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
}));

export const walletAuthorizations = onchainTable(
  "wallet_authorizations",
  (t) => ({
    id: t.text().primaryKey(),
    fid: t.integer().notNull(),
    wallet: t.text().notNull(),
    blockNumber: t.bigint().notNull(),
    transactionHash: t.text().notNull(),
    timestamp: t.bigint().notNull(),
  })
);

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

export const brandRewardWithdrawals = onchainTable(
  "brand_reward_withdrawals",
  (t) => ({
    id: t.text().primaryKey(),
    brandId: t.integer().notNull(),
    fid: t.integer().notNull(),
    amount: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    transactionHash: t.text().notNull(),
    timestamp: t.bigint().notNull(),
  })
);

export const brndPowerLevelUps = onchainTable("brnd_power_level_ups", (t) => ({
  id: t.text().primaryKey(),
  fid: t.integer().notNull(),
  newLevel: t.integer().notNull(),
  wallet: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

// User leaderboard - only all-time (users table has points field)
export const allTimeUserLeaderboard = onchainTable(
  "all_time_user_leaderboard",
  (t) => ({
    fid: t.integer().primaryKey(),
    points: t.bigint().notNull().default(0n),
    rank: t.integer(),
    blockNumber: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  })
);

// Brand leaderboards - daily, weekly, monthly, and all-time
export const dailyBrandLeaderboard = onchainTable(
  "daily_brand_leaderboard",
  (t) => ({
    id: t.text().primaryKey(), // "brandId-day" composite key
    brandId: t.integer().notNull(),
    day: t.bigint().notNull(), // Day timestamp (midnight UTC)
    points: t.bigint().notNull().default(0n),
    goldCount: t.integer().notNull().default(0), // Number of gold positions
    silverCount: t.integer().notNull().default(0), // Number of silver positions
    bronzeCount: t.integer().notNull().default(0), // Number of bronze positions
    rank: t.integer(), // Pre-calculated rank for this day
    blockNumber: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  })
);

export const weeklyBrandLeaderboard = onchainTable(
  "weekly_brand_leaderboard",
  (t) => ({
    id: t.text().primaryKey(), // "brandId-week" composite key
    brandId: t.integer().notNull(),
    week: t.bigint().notNull(), // Week start timestamp (Friday 13:13 UTC)
    points: t.bigint().notNull().default(0n),
    goldCount: t.integer().notNull().default(0),
    silverCount: t.integer().notNull().default(0),
    bronzeCount: t.integer().notNull().default(0),
    rank: t.integer(),
    blockNumber: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  })
);

export const monthlyBrandLeaderboard = onchainTable(
  "monthly_brand_leaderboard",
  (t) => ({
    id: t.text().primaryKey(), // "brandId-month" composite key
    brandId: t.integer().notNull(),
    month: t.bigint().notNull(), // Month start timestamp (midnight UTC)
    points: t.bigint().notNull().default(0n),
    goldCount: t.integer().notNull().default(0),
    silverCount: t.integer().notNull().default(0),
    bronzeCount: t.integer().notNull().default(0),
    rank: t.integer(),
    blockNumber: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  })
);

export const allTimeBrandLeaderboard = onchainTable(
  "all_time_brand_leaderboard",
  (t) => ({
    brandId: t.integer().primaryKey(),
    points: t.bigint().notNull().default(0n),
    goldCount: t.integer().notNull().default(0),
    silverCount: t.integer().notNull().default(0),
    bronzeCount: t.integer().notNull().default(0),
    rank: t.integer(),
    blockNumber: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  })
);
