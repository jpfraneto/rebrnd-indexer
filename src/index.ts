import { ponder } from "ponder:registry";
import { eq, desc, asc } from "ponder";
import {
  brands,
  votes,
  users,
  walletAuthorizations,
  rewardClaims,
  brandRewardWithdrawals,
  brndPowerLevelUps,
  allTimeUserLeaderboard,
  dailyBrandLeaderboard,
  weeklyBrandLeaderboard,
  monthlyBrandLeaderboard,
  allTimeBrandLeaderboard,
} from "../ponder.schema";

const sendVoteToBackend = async (voteData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error("INDEXER_API_KEY not set - skipping vote submission");
      return;
    }

    const response = await fetch(`${baseUrl}/blockchain-service/submit-vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Indexer-Source":
          process.env.INDEXER_SOURCE || "ponder-stories-in-motion-v8",
      },
      body: JSON.stringify(voteData),
    });

    if (!response.ok) {
      console.error(
        "Failed to send vote to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Vote successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending vote to backend:", error);
  }
};

const sendBrandToBackend = async (brandData: any, endpoint?: string) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error("INDEXER_API_KEY not set - skipping brand submission");
      return;
    }

    const finalEndpoint = endpoint || `${baseUrl}/blockchain-service/brands`;
    const response = await fetch(finalEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Indexer-Source":
          process.env.INDEXER_SOURCE || "ponder-stories-in-motion-v8",
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      console.error(
        "Failed to send brand to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Brand successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending brand to backend:", error);
  }
};

const sendRewardClaimToBackend = async (rewardClaimData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error(
        "INDEXER_API_KEY not set - skipping reward claim submission"
      );
      return;
    }

    const response = await fetch(
      `${baseUrl}/blockchain-service/submit-reward-claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Indexer-Source": "ponder-stories-in-motion-v8",
        },
        body: JSON.stringify(rewardClaimData),
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to send reward claim to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Reward claim successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending reward claim to backend:", error);
  }
};

const sendUserLevelUpToBackend = async (userLevelUpData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error(
        "INDEXER_API_KEY not set - skipping user level-up submission"
      );
      return;
    }

    const response = await fetch(
      `${baseUrl}/blockchain-service/update-user-level`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Indexer-Source": "ponder-stories-in-motion-v8",
        },
        body: JSON.stringify(userLevelUpData),
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to send user level-up to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("User level-up successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending user level-up to backend:", error);
  }
};

const sendLeaderboardSummaryToBackend = async (summaryData: any) => {
  try {
    const apiKey = process.env.INDEXER_API_KEY;
    const baseUrl =
      process.env.BACKEND_API_BASE_URL || "https://poiesis.anky.app";
    if (!apiKey) {
      console.error(
        "INDEXER_API_KEY not set - skipping leaderboard summary submission"
      );
      return;
    }

    const response = await fetch(
      `${baseUrl}/blockchain-service/leaderboard-summary`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Indexer-Source": "ponder-stories-in-motion-v8",
        },
        body: JSON.stringify(summaryData),
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to send leaderboard summary to backend:",
        response.status,
        response.statusText
      );
    } else {
      console.log("Leaderboard summary successfully sent to backend");
    }
  } catch (error) {
    console.error("Error sending leaderboard summary to backend:", error);
  }
};

ponder.on("BRNDSEASON1:PodiumCreated", async ({ event, context }) => {
  const { voter, fid, brandIds, cost } = event.args;
  const { block, transaction } = event;

  // Calculate day number from block timestamp (consistent and repeatable)
  const day = calculateDayNumber(block.timestamp);

  const voteId = `${transaction.hash}`;

  await context.db.insert(votes).values({
    id: voteId,
    voter: voter.toLowerCase(),
    fid: Number(fid),
    day,
    brandIds: JSON.stringify(Array.from(brandIds)),
    cost,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });

  const voteData = {
    id: voteId,
    voter: voter.toLowerCase(),
    fid: Number(fid),
    day: day.toString(),
    brandIds: Array.from(brandIds),
    cost: cost.toString(),
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
  };

  await sendVoteToBackend(voteData);

  // Use upsert pattern with onConflictDoUpdate
  // For existing users, increment totalVotes; for new users, set to 1
  await context.db
    .insert(users)
    .values({
      fid: Number(fid),
      brndPowerLevel: 0,
      totalVotes: 1,
      points: 0n, // Will be updated by updateUserPoints
      lastVoteDay: Number(day),
      blockNumber: block.number,
      transactionHash: transaction.hash,
    })
    .onConflictDoUpdate((existing) => ({
      totalVotes: existing.totalVotes + 1,
      lastVoteDay: Number(day),
      blockNumber: block.number,
      transactionHash: transaction.hash,
    }));

  // Award 3 points for voting
  await updateUserPoints(context, Number(fid), 3n, block, transaction);

  // Award points to brands based on their position in the podium
  // Points are distributed from the $BRND cost: 60% to gold, 30% to silver, 10% to bronze
  // brandIds is [gold, silver, bronze]
  const brandIdsArray = Array.from(brandIds).map(Number);
  await updateBrandPoints(context, brandIdsArray, cost, block, transaction);

  // Check for period end and cast summary if period changed
  const { day: periodDay, week, month } = getTimePeriods(block.timestamp);

  // Check if day changed
  if (lastSeenDay !== null && lastSeenDay !== periodDay) {
    const dayKey = `day-${lastSeenDay}`;
    if (!processedPeriodSummaries.has(dayKey)) {
      await checkAndCastPeriodSummary(
        context,
        block.timestamp,
        "day",
        lastSeenDay
      );
      processedPeriodSummaries.add(dayKey);
    }
  }
  lastSeenDay = periodDay;

  // Check if week changed
  if (lastSeenWeek !== null && lastSeenWeek !== week) {
    const weekKey = `week-${lastSeenWeek}`;
    if (!processedPeriodSummaries.has(weekKey)) {
      await checkAndCastPeriodSummary(
        context,
        block.timestamp,
        "week",
        lastSeenWeek
      );
      processedPeriodSummaries.add(weekKey);
    }
  }
  lastSeenWeek = week;

  // Check if month changed
  if (lastSeenMonth !== null && lastSeenMonth !== month) {
    const monthKey = `month-${lastSeenMonth}`;
    if (!processedPeriodSummaries.has(monthKey)) {
      await checkAndCastPeriodSummary(
        context,
        block.timestamp,
        "month",
        lastSeenMonth
      );
      processedPeriodSummaries.add(monthKey);
    }
  }
  lastSeenMonth = month;
});

ponder.on("BRNDSEASON1:BrandCreated", async ({ event, context }) => {
  const { brandId, handle, fid, walletAddress, createdAt } = event.args;
  const { block, transaction } = event;

  await context.db.insert(brands).values({
    id: Number(brandId),
    fid: Number(fid),
    walletAddress: walletAddress.toLowerCase(),
    handle,
    metadataHash: "",
    totalBrndAwarded: 0n,
    availableBrnd: 0n,
    createdAt,
    blockNumber: block.number,
    transactionHash: transaction.hash,
  });

  const brandData = {
    id: Number(brandId),
    fid: Number(fid),
    walletAddress: walletAddress.toLowerCase(),
    handle,
    createdAt: createdAt.toString(),
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
  };
  console.log("a new brand was created", brandData);
  await sendBrandToBackend(brandData);
});

ponder.on("BRNDSEASON1:BrandsCreated", async ({ event, context }) => {
  const { brandIds, handles, fids, walletAddresses, createdAt } = event.args;
  const { block, transaction } = event;

  const brandsToInsert = brandIds.map((brandId: number, index: number) => ({
    id: Number(brandId),
    fid: Number(fids[index]),
    walletAddress: walletAddresses[index]!.toLowerCase(),
    handle: handles[index] || "",
    metadataHash: "",
    totalBrndAwarded: 0n,
    availableBrnd: 0n,
    createdAt,
    blockNumber: block.number,
    transactionHash: transaction.hash as string,
  }));

  await context.db.insert(brands).values(brandsToInsert);

  for (let i = 0; i < brandIds.length; i++) {
    const brandData = {
      id: Number(brandIds[i]),
      fid: Number(fids[i]),
      walletAddress: walletAddresses[i]!.toLowerCase(),
      handle: handles[i] || "",
      createdAt: createdAt.toString(),
      blockNumber: block.number.toString(),
      transactionHash: transaction.hash,
      timestamp: block.timestamp.toString(),
    };

    console.log("a new brand was created", brandData);
    //await sendBrandToBackend(brandData);
  }
});

ponder.on("BRNDSEASON1:WalletAuthorized", async ({ event, context }) => {
  const { fid, wallet } = event.args;
  const { block, transaction } = event;

  const authId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(walletAuthorizations).values({
    id: authId,
    fid: Number(fid),
    wallet: wallet.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("BRNDSEASON1:RewardClaimed", async ({ event, context }) => {
  const { recipient, fid, amount, castHash, caller } = event.args;
  const { block, transaction } = event;

  // Calculate day number from block timestamp (consistent and repeatable)
  const day = calculateDayNumber(block.timestamp);

  const claimId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(rewardClaims).values({
    id: claimId,
    recipient: recipient.toLowerCase(),
    fid: Number(fid),
    amount,
    day,
    castHash,
    caller: caller.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });

  const rewardClaimData = {
    id: claimId,
    recipient: recipient.toLowerCase(),
    fid: Number(fid),
    amount: amount.toString(),
    day: day.toString(),
    castHash,
    caller: caller.toLowerCase(),
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
  };

  await sendRewardClaimToBackend(rewardClaimData);

  // Award points based on brndPowerLevel: (brndPowerLevel * 3) points
  // Get user's current brndPowerLevel
  const user = await context.db.find(users, { fid: Number(fid) });

  if (user) {
    const pointsToAdd = BigInt(user.brndPowerLevel * 3);
    await updateUserPoints(
      context,
      Number(fid),
      pointsToAdd,
      block,
      transaction
    );
  }
});

ponder.on("BRNDSEASON1:BrandRewardWithdrawn", async ({ event, context }) => {
  const { brandId, fid, amount } = event.args;
  const { block, transaction } = event;

  const withdrawalId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(brandRewardWithdrawals).values({
    id: withdrawalId,
    brandId: Number(brandId),
    fid: Number(fid),
    amount,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });
});

ponder.on("BRNDSEASON1:BrndPowerLevelUp", async ({ event, context }) => {
  const { fid, newLevel, wallet } = event.args;
  const { block, transaction } = event;

  const levelUpId = `${transaction.hash}-${event.log.logIndex}`;

  await context.db.insert(brndPowerLevelUps).values({
    id: levelUpId,
    fid: Number(fid),
    newLevel: Number(newLevel),
    wallet: wallet.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
    timestamp: block.timestamp,
  });

  await context.db
    .insert(users)
    .values({
      fid: Number(fid),
      brndPowerLevel: Number(newLevel),
      totalVotes: 0,
      points: 0n,
      blockNumber: block.number,
      transactionHash: transaction.hash,
    })
    .onConflictDoUpdate((existing) => ({
      brndPowerLevel: Number(newLevel),
      blockNumber: block.number,
      transactionHash: transaction.hash,
    }));

  const userLevelUpData = {
    fid: Number(fid),
    brndPowerLevel: Number(newLevel),
    wallet: wallet.toLowerCase(),
    levelUpId: levelUpId,
    blockNumber: block.number.toString(),
    transactionHash: transaction.hash,
    timestamp: block.timestamp.toString(),
  };

  await sendUserLevelUpToBackend(userLevelUpData);
});

// Helper function to calculate day number from timestamp
// Day number = floor(timestamp / 86400) where timestamp is in seconds
// This gives a consistent day number that increments at midnight UTC
const calculateDayNumber = (timestamp: bigint): bigint => {
  return timestamp / 86400n;
};

// Helper function to calculate day, week, and month timestamps
// Days reset at midnight UTC, weeks reset on Fridays at 13:13 UTC
const getTimePeriods = (timestamp: bigint) => {
  const timestampSeconds = Number(timestamp);
  const date = new Date(timestampSeconds * 1000);

  // Day: midnight UTC (using day number for consistency)
  const dayNumber = calculateDayNumber(timestamp);
  const dayStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const day = BigInt(Math.floor(dayStart.getTime() / 1000));

  // Week: Friday 13:13 UTC
  // Find the most recent Friday at 13:13 UTC
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getUTCDay(); // 0 = Sunday, 5 = Friday
  let daysToSubtract = 0;

  if (dayOfWeek === 5) {
    // It's Friday
    if (
      weekStart.getUTCHours() < 13 ||
      (weekStart.getUTCHours() === 13 && weekStart.getUTCMinutes() < 13)
    ) {
      daysToSubtract = 7; // Before 13:13, go to previous Friday
    }
  } else if (dayOfWeek < 5) {
    // Before Friday, go back to previous Friday
    daysToSubtract = dayOfWeek + 2; // +2 because: Sun(0)->Fri(-2), Mon(1)->Fri(-3), etc.
  } else {
    // Saturday (6), go back 1 day to Friday
    daysToSubtract = 1;
  }

  weekStart.setUTCDate(weekStart.getUTCDate() - daysToSubtract);
  weekStart.setUTCHours(13, 13, 0, 0);
  const week = BigInt(Math.floor(weekStart.getTime() / 1000));

  // Month: first day of month at midnight UTC
  const monthStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)
  );
  const month = BigInt(Math.floor(monthStart.getTime() / 1000));

  return { day, week, month };
};

// Helper function to update user points (only all-time)
const updateUserPoints = async (
  context: any,
  fid: number,
  pointsToAdd: bigint,
  block: any,
  transaction: any
) => {
  const timestamp = block.timestamp;

  // Update user's total points
  const existingUser = await context.db.find(users, { fid });

  if (existingUser) {
    // User exists, increment points
    await context.db.update(users, { fid }).set({
      points: existingUser.points + pointsToAdd,
      blockNumber: block.number,
      transactionHash: transaction.hash,
    });
  } else {
    // New user, set initial points
    await context.db.insert(users).values({
      fid,
      brndPowerLevel: 0,
      totalVotes: 0,
      points: pointsToAdd,
      blockNumber: block.number,
      transactionHash: transaction.hash,
    });
  }

  // Update all-time user leaderboard
  const existingAllTime = await context.db.find(allTimeUserLeaderboard, {
    fid,
  });

  if (existingAllTime) {
    await context.db.update(allTimeUserLeaderboard, { fid }).set({
      points: existingAllTime.points + pointsToAdd,
      blockNumber: block.number,
      updatedAt: timestamp,
    });
  } else {
    await context.db.insert(allTimeUserLeaderboard).values({
      fid,
      points: pointsToAdd,
      blockNumber: block.number,
      updatedAt: timestamp,
    });
  }
};

// Helper function to update brand leaderboards
// brandIds array: [gold, silver, bronze]
// Points are distributed from $BRND cost: 60% to gold, 30% to silver, 10% to bronze
const updateBrandPoints = async (
  context: any,
  brandIds: number[],
  cost: bigint,
  block: any,
  transaction: any
) => {
  const timestamp = block.timestamp;
  const { day, week, month } = getTimePeriods(timestamp);

  // Calculate points based on $BRND cost distribution
  // Gold (1st): 60% of cost
  // Silver (2nd): 30% of cost
  // Bronze (3rd): 10% of cost
  const goldPoints = (cost * 60n) / 100n; // 60%
  const silverPoints = (cost * 30n) / 100n; // 30%
  const bronzePoints = (cost * 10n) / 100n; // 10%
  const points = [goldPoints, silverPoints, bronzePoints];
  const positions = ["gold", "silver", "bronze"] as const;

  for (let i = 0; i < brandIds.length && i < 3; i++) {
    const brandId = brandIds[i];
    if (brandId === undefined) continue;

    const pointsToAdd = points[i];
    const position = positions[i];

    // Update daily brand leaderboard
    const dailyId = `${brandId}-${day}`;
    const existingDaily = await context.db.find(dailyBrandLeaderboard, {
      id: dailyId,
    });

    if (existingDaily) {
      const updateData: any = {
        points: existingDaily.points + pointsToAdd,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      if (position === "gold")
        updateData.goldCount = existingDaily.goldCount + 1;
      else if (position === "silver")
        updateData.silverCount = existingDaily.silverCount + 1;
      else if (position === "bronze")
        updateData.bronzeCount = existingDaily.bronzeCount + 1;

      await context.db
        .update(dailyBrandLeaderboard, { id: dailyId })
        .set(updateData);
    } else {
      const insertData: any = {
        id: dailyId,
        brandId,
        day,
        points: pointsToAdd,
        goldCount: position === "gold" ? 1 : 0,
        silverCount: position === "silver" ? 1 : 0,
        bronzeCount: position === "bronze" ? 1 : 0,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      await context.db.insert(dailyBrandLeaderboard).values(insertData);
    }

    // Update weekly brand leaderboard
    const weeklyId = `${brandId}-${week}`;
    const existingWeekly = await context.db.find(weeklyBrandLeaderboard, {
      id: weeklyId,
    });

    if (existingWeekly) {
      const updateData: any = {
        points: existingWeekly.points + pointsToAdd,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      if (position === "gold")
        updateData.goldCount = existingWeekly.goldCount + 1;
      else if (position === "silver")
        updateData.silverCount = existingWeekly.silverCount + 1;
      else if (position === "bronze")
        updateData.bronzeCount = existingWeekly.bronzeCount + 1;

      await context.db
        .update(weeklyBrandLeaderboard, { id: weeklyId })
        .set(updateData);
    } else {
      const insertData: any = {
        id: weeklyId,
        brandId,
        week,
        points: pointsToAdd,
        goldCount: position === "gold" ? 1 : 0,
        silverCount: position === "silver" ? 1 : 0,
        bronzeCount: position === "bronze" ? 1 : 0,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      await context.db.insert(weeklyBrandLeaderboard).values(insertData);
    }

    // Update monthly brand leaderboard
    const monthlyId = `${brandId}-${month}`;
    const existingMonthly = await context.db.find(monthlyBrandLeaderboard, {
      id: monthlyId,
    });

    if (existingMonthly) {
      const updateData: any = {
        points: existingMonthly.points + pointsToAdd,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      if (position === "gold")
        updateData.goldCount = existingMonthly.goldCount + 1;
      else if (position === "silver")
        updateData.silverCount = existingMonthly.silverCount + 1;
      else if (position === "bronze")
        updateData.bronzeCount = existingMonthly.bronzeCount + 1;

      await context.db
        .update(monthlyBrandLeaderboard, { id: monthlyId })
        .set(updateData);
    } else {
      const insertData: any = {
        id: monthlyId,
        brandId,
        month,
        points: pointsToAdd,
        goldCount: position === "gold" ? 1 : 0,
        silverCount: position === "silver" ? 1 : 0,
        bronzeCount: position === "bronze" ? 1 : 0,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      await context.db.insert(monthlyBrandLeaderboard).values(insertData);
    }

    // Update all-time brand leaderboard
    const existingAllTime = await context.db.find(allTimeBrandLeaderboard, {
      brandId,
    });

    if (existingAllTime) {
      const updateData: any = {
        points: existingAllTime.points + pointsToAdd,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      if (position === "gold")
        updateData.goldCount = existingAllTime.goldCount + 1;
      else if (position === "silver")
        updateData.silverCount = existingAllTime.silverCount + 1;
      else if (position === "bronze")
        updateData.bronzeCount = existingAllTime.bronzeCount + 1;

      await context.db
        .update(allTimeBrandLeaderboard, { brandId })
        .set(updateData);
    } else {
      const insertData: any = {
        brandId,
        points: pointsToAdd,
        goldCount: position === "gold" ? 1 : 0,
        silverCount: position === "silver" ? 1 : 0,
        bronzeCount: position === "bronze" ? 1 : 0,
        blockNumber: block.number,
        updatedAt: timestamp,
      };
      await context.db.insert(allTimeBrandLeaderboard).values(insertData);
    }
  }
};

// Helper function to check for period end and cast summary
const checkAndCastPeriodSummary = async (
  context: any,
  timestamp: bigint,
  periodType: "day" | "week" | "month",
  periodValue: bigint
) => {
  // Get top 3 brands for this period
  let topBrands: any[] = [];

  if (periodType === "day") {
    topBrands = await context.db.sql
      .select({
        brandId: dailyBrandLeaderboard.brandId,
        points: dailyBrandLeaderboard.points,
        handle: brands.handle,
      })
      .from(dailyBrandLeaderboard)
      .innerJoin(brands, eq(brands.id, dailyBrandLeaderboard.brandId))
      .where(eq(dailyBrandLeaderboard.day, periodValue))
      .orderBy(desc(dailyBrandLeaderboard.points))
      .limit(3)
      .execute();
  } else if (periodType === "week") {
    topBrands = await context.db.sql
      .select({
        brandId: weeklyBrandLeaderboard.brandId,
        points: weeklyBrandLeaderboard.points,
        handle: brands.handle,
      })
      .from(weeklyBrandLeaderboard)
      .innerJoin(brands, eq(brands.id, weeklyBrandLeaderboard.brandId))
      .where(eq(weeklyBrandLeaderboard.week, periodValue))
      .orderBy(desc(weeklyBrandLeaderboard.points))
      .limit(3)
      .execute();
  } else if (periodType === "month") {
    topBrands = await context.db.sql
      .select({
        brandId: monthlyBrandLeaderboard.brandId,
        points: monthlyBrandLeaderboard.points,
        handle: brands.handle,
      })
      .from(monthlyBrandLeaderboard)
      .innerJoin(brands, eq(brands.id, monthlyBrandLeaderboard.brandId))
      .where(eq(monthlyBrandLeaderboard.month, periodValue))
      .orderBy(desc(monthlyBrandLeaderboard.points))
      .limit(3)
      .execute();
  }

  if (topBrands.length >= 3) {
    const periodNames = {
      day: "Daily",
      week: "Weekly",
      month: "Monthly",
    };

    const summaryData = {
      periodType,
      periodValue: periodValue.toString(),
      periodName: periodNames[periodType],
      topBrand: {
        brandId: topBrands[0].brandId,
        handle: topBrands[0].handle,
        points: topBrands[0].points.toString(),
      },
      runnerUp: {
        brandId: topBrands[1].brandId,
        handle: topBrands[1].handle,
        points: topBrands[1].points.toString(),
      },
      thirdPlace: {
        brandId: topBrands[2].brandId,
        handle: topBrands[2].handle,
        points: topBrands[2].points.toString(),
      },
      timestamp: timestamp.toString(),
    };

    await sendLeaderboardSummaryToBackend(summaryData);
  }
};

// Track which periods we've already cast summaries for
// Format: "day-{dayValue}", "week-{weekValue}", "month-{monthValue}"
const processedPeriodSummaries = new Set<string>();

// Track last seen periods to detect changes
let lastSeenDay: bigint | null = null;
let lastSeenWeek: bigint | null = null;
let lastSeenMonth: bigint | null = null;

ponder.on("BRNDSEASON1:BrandUpdated", async ({ event, context }) => {
  const { brandId, newMetadataHash, newFid, newWalletAddress } = event.args;
  const { block, transaction } = event;

  await context.db.update(brands, { id: Number(brandId) }).set({
    metadataHash: newMetadataHash,
    fid: Number(newFid),
    walletAddress: newWalletAddress.toLowerCase(),
    blockNumber: block.number,
    transactionHash: transaction.hash,
  });
});
