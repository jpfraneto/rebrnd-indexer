import { ponder } from "ponder:registry";
import {
  auction,
  bid,
  auctionExtension,
  userStats,
  dailyStats,
  castCollectible,
  brndCollector,
  auctionSettled,
} from "../ponder.schema";
import { AuctionAbi } from "../abis/AuctionAbi";

const BRNDBOT_FID = 1341847n;

// Helper function to get date string from timestamp
function getDateString(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().split("T")[0] || ""; // YYYY-MM-DD
}

// Helper function to get start of day timestamp
function getStartOfDayTimestamp(timestamp: bigint): bigint {
  const date = new Date(Number(timestamp) * 1000);
  date.setUTCHours(0, 0, 0, 0);
  return BigInt(Math.floor(date.getTime() / 1000));
}

// Helper function to update user stats
async function updateUserStats(
  context: any,
  address: string,
  fid: bigint | null,
  updates: any
) {
  const userId = address.toLowerCase();
  const existing = await context.db.find(userStats, { id: userId });

  if (existing) {
    await context.db.delete(userStats, { id: userId });
    await context.db.insert(userStats).values({
      ...existing,
      ...updates,
      lastActivityAt: updates.timestamp || existing.lastActivityAt,
    });
  } else {
    await context.db.insert(userStats).values({
      id: userId,
      address: address as `0x${string}`,
      fid: fid || 0n,
      totalAuctionsCreated: 0,
      totalCreatorEarnings: 0n,
      successfulAuctions: 0,
      totalBidsPlaced: 0,
      totalAmountBid: 0n,
      auctionsWon: 0,
      totalAmountWon: 0n,
      auctionsLost: 0,
      firstActivityAt: updates.timestamp,
      lastActivityAt: updates.timestamp,
      ...updates,
    });
  }
}

// Helper function to update daily stats
async function updateDailyStats(context: any, timestamp: bigint, updates: any) {
  const dateStr = getDateString(timestamp);
  const dayStart = getStartOfDayTimestamp(timestamp);
  const existing = await context.db.find(dailyStats, { id: dateStr });

  if (existing) {
    await context.db.delete(dailyStats, { id: dateStr });
    await context.db.insert(dailyStats).values({
      ...existing,
      ...updates,
    });
  } else {
    await context.db.insert(dailyStats).values({
      id: dateStr,
      date: dateStr,
      timestamp: dayStart,
      auctionsStarted: 0,
      auctionsSettled: 0,
      auctionsCancelled: 0,
      totalBids: 0,
      totalVolume: 0n,
      uniqueBidders: 0,
      uniqueCreators: 0,
      protocolFees: 0n,
      averageAuctionDuration: null,
      medianBidAmount: null,
      highestBid: null,
      ...updates,
    });
  }
}

// Auction Started Event
ponder.on("Auction:AuctionStarted", async ({ event, context }) => {
  const { castHash, creator, creatorFid, endTime, authorizer } = event.args;
  const { block, transaction } = event;

  // Get auction parameters from contract
  const auctionData = await context.client.readContract({
    abi: AuctionAbi,
    address: "0xFC52e33F48Dd3fcd5EE428c160722efda645D74A",
    functionName: "auctions",
    args: [castHash],
  });

  const params = auctionData[9]; // The params struct is at index 9

  // Create auction record
  await context.db.insert(auction).values({
    id: castHash,
    castHash,
    creator,
    creatorFid,
    state: 1, // Active
    minBid: BigInt(params.minBid),
    minBidIncrementBps: Number(params.minBidIncrementBps),
    protocolFeeBps: Number(params.protocolFeeBps),
    duration: Number(params.duration),
    extension: Number(params.extension),
    extensionThreshold: Number(params.extensionThreshold),
    startTime: block.timestamp,
    endTime: BigInt(endTime),
    lastBidAt: block.timestamp,
    highestBidder: auctionData[2],
    highestBidderFid: BigInt(auctionData[3]),
    highestBid: BigInt(auctionData[4]),
    totalBids: 1,
    settledAt: null,
    treasuryAmount: null,
    creatorAmount: null,
    startBlockNumber: block.number,
    startTransactionHash: transaction.hash,
  });

  // Update user stats for creator
  await updateUserStats(context, creator, creatorFid, {
    totalAuctionsCreated: 1,
    timestamp: block.timestamp,
  });

  // Update daily stats
  await updateDailyStats(context, block.timestamp, {
    auctionsStarted: 1,
    uniqueCreators: 1,
  });
});

// Bid Placed Event
ponder.on("Auction:BidPlaced", async ({ event, context }) => {
  const { castHash, bidder, bidderFid, amount, authorizer } = event.args;
  const { block, transaction } = event;

  // Get current auction data to determine bid index
  const currentAuction = await context.db.find(auction, { id: castHash });
  if (!currentAuction) return;

  const bidIndex = currentAuction.totalBids;

  // Create bid record
  await context.db.insert(bid).values({
    id: `${castHash}-${bidIndex}`,
    castHash,
    bidder,
    bidderFid,
    amount,
    bidIndex,
    timestamp: block.timestamp,
    blockNumber: block.number,
    transactionHash: transaction.hash,
    authorizer,
    wasRefunded: false,
    refundedAt: null,
  });

  // Update auction with new highest bid
  await context.db.delete(auction, { id: castHash });
  await context.db.insert(auction).values({
    ...currentAuction,
    highestBidder: bidder,
    highestBidderFid: bidderFid,
    highestBid: amount,
    lastBidAt: block.timestamp,
    totalBids: currentAuction.totalBids + 1,
  });

  // Update user stats for bidder
  await updateUserStats(context, bidder, bidderFid, {
    totalBidsPlaced: 1,
    totalAmountBid: amount,
    timestamp: block.timestamp,
  });

  // Update daily stats
  await updateDailyStats(context, block.timestamp, {
    totalBids: 1,
    totalVolume: amount,
    uniqueBidders: 1,
  });

  // Check if this is a bid on a cast from @brnd or @brndbot
  const brndbotFid = 1341847;
  const brndFid = 1108951;

  if ([brndFid, brndbotFid].includes(Number(currentAuction.creatorFid))) {
    // Check if event happened within last 5 minutes
    const currentTime = Date.now();
    const eventTime = Number(block.timestamp) * 1000;
    const timeDiff = currentTime - eventTime;
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (timeDiff <= fiveMinutesInMs) {
      try {
        // Fetch bidder user data from Neynar API
        const userUrl = `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${bidderFid}`;
        const userResponse = await fetch(userUrl, {
          method: "GET",
          headers: {
            "x-api-key": process.env.NEYNAR_API_KEY!,
          },
        });

        if (userResponse.ok) {
          const userData = (await userResponse.json()) as any;
          const bidderUser = userData.users?.[0];

          if (bidderUser && bidderUser.username) {
            // Determine the original cast author
            const originalAuthor =
              Number(currentAuction.creatorFid) === brndFid
                ? "@brnd"
                : "@brndbot";

            // Create the bid cast text
            const bidCastText = `@${bidderUser.username} just bid on this cast from ${originalAuthor}`;

            // Publish the cast from brndbot
            const castUrl = `https://api.neynar.com/v2/farcaster/cast`;
            const castOptions = {
              method: "POST",
              headers: {
                "x-api-key": process.env.NEYNAR_API_KEY!,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                signer_uuid: process.env.BRNDBOT_SIGNER_UUID,
                text: bidCastText,
                embeds: [
                  { url: `https://warpcast.com/~/conversations/${castHash}` },
                ],
              }),
            };

            const castResponse = await fetch(castUrl, castOptions);
            if (castResponse.ok) {
              const castData = await castResponse.json();
              console.log("Successfully published bid cast:", castData);
            } else {
              console.error(
                "Failed to publish bid cast:",
                await castResponse.text()
              );
            }
          } else {
            console.log("Bidder user data not found or no username available");
          }
        } else {
          console.error(
            "Failed to fetch bidder user data:",
            await userResponse.text()
          );
        }
      } catch (error) {
        console.error("Error in bid notification:", error);
      }
    } else {
      console.log(
        "Bid event too old (>5 minutes), skipping bid cast notification"
      );
    }
  }
});

// Bid Refunded Event
ponder.on("Auction:BidRefunded", async ({ event, context }) => {
  const { castHash, to: refundedTo, amount } = event.args;
  const { block } = event;

  // Find and update the refunded bid
  // Since we need to find a specific bid by multiple criteria, we'll use the bid ID pattern
  // The bid ID is constructed as `${castHash}-${bidIndex}`, so we need to find the right bid
  // For now, let's create a new bid record with the refunded status
  // This is a simplified approach - in a real implementation, you'd need to track bid indices properly

  // Create a refunded bid record
  await context.db.insert(bid).values({
    id: `${castHash}-refunded-${block.timestamp}`,
    castHash,
    bidder: refundedTo,
    bidderFid: 0n, // We don't have this info in the refund event
    amount,
    bidIndex: 0, // Placeholder
    timestamp: block.timestamp,
    blockNumber: block.number,
    transactionHash: block.hash,
    authorizer: refundedTo, // Placeholder
    wasRefunded: true,
    refundedAt: block.timestamp,
  });
});

// Auction Extended Event
ponder.on("Auction:AuctionExtended", async ({ event, context }) => {
  const { castHash, newEndTime } = event.args;
  const { block, transaction } = event;

  // Get current auction data
  const currentAuction = await context.db.find(auction, { id: castHash });
  if (!currentAuction) return;

  // Count existing extensions - we'll use a simple approach for now
  // In a real implementation, you'd need to track extension counts properly
  // For now, we'll just use 0 as the extension index
  let extensionIndex = 0;

  // Create extension record
  await context.db.insert(auctionExtension).values({
    id: `${castHash}-${extensionIndex}`,
    castHash,
    oldEndTime: currentAuction.endTime,
    newEndTime: BigInt(newEndTime),
    extensionIndex,
    triggeredBy: currentAuction.highestBidder!,
    timestamp: block.timestamp,
    blockNumber: block.number,
    transactionHash: transaction.hash,
  });

  // Update auction with new end time
  await context.db.delete(auction, { id: castHash });
  await context.db.insert(auction).values({
    ...currentAuction,
    endTime: BigInt(newEndTime),
  });
});

// Auction Settled Event
ponder.on("Auction:AuctionSettled", async ({ event, context }) => {
  const { castHash, winner, winnerFid, amount } = event.args;
  const { block, transaction } = event;

  // Get auction data for fee calculation
  const currentAuction = await context.db.find(auction, { id: castHash });
  if (!currentAuction) return;

  // Calculate fees
  const treasuryAmount =
    (amount * BigInt(currentAuction.protocolFeeBps)) / 10000n;
  const creatorAmount = amount - treasuryAmount;

  // Update auction as settled
  await context.db.delete(auction, { id: castHash });
  await context.db.insert(auction).values({
    ...currentAuction,
    state: 3, // Settled
    settledAt: block.timestamp,
    treasuryAmount,
    creatorAmount,
  });

  const brndbotFid = 1341847;
  const brndFid = 1108951;

  if ([brndFid, brndbotFid].includes(Number(currentAuction.creatorFid))) {
    // Check if event happened within last 5 minutes
    const currentTime = Date.now();
    const eventTime = Number(block.timestamp) * 1000;
    const timeDiff = currentTime - eventTime;
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (timeDiff <= fiveMinutesInMs) {
      try {
        // Fetch user data from Neynar API
        const userUrl = `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${winnerFid}`;
        const userResponse = await fetch(userUrl, {
          method: "GET",
          headers: {
            "x-api-key": process.env.NEYNAR_API_KEY!,
          },
        });

        if (userResponse.ok) {
          const userData = (await userResponse.json()) as any;
          const winnerUser = userData.users?.[0];

          if (winnerUser && winnerUser.username) {
            // Determine the original cast author
            const originalAuthor =
              Number(currentAuction.creatorFid) === brndFid
                ? "@brnd"
                : "@brndbot";

            // Create the cast text
            const castText = `@${winnerUser.username} just collected this cast from ${originalAuthor}`;

            // Publish the cast from brndbot
            const castUrl = `https://api.neynar.com/v2/farcaster/cast`;
            const castOptions = {
              method: "POST",
              headers: {
                "x-api-key": process.env.NEYNAR_API_KEY!,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                signer_uuid: process.env.BRNDBOT_SIGNER_UUID,
                text: castText,
                embeds: [
                  { url: `https://warpcast.com/~/conversations/${castHash}` },
                ],
              }),
            };

            const castResponse = await fetch(castUrl, castOptions);
            if (castResponse.ok) {
              const castData = await castResponse.json();
              console.log("Successfully published cast:", castData);
            } else {
              console.error(
                "Failed to publish cast:",
                await castResponse.text()
              );
            }
          } else {
            console.log("Winner user data not found or no username available");
          }
        } else {
          console.error(
            "Failed to fetch user data:",
            await userResponse.text()
          );
        }
      } catch (error) {
        console.error("Error in cast collection notification:", error);
      }
    } else {
      console.log("Event too old (>5 minutes), skipping cast notification");
    }
  }
  // Create cast collectible record
  await context.db.insert(castCollectible).values({
    id: castHash,
    castHash,
    creator: currentAuction.creator,
    creatorFid: currentAuction.creatorFid,
    winner,
    winnerFid,
    finalAmount: amount,
    isFromBrndbot: [brndFid, brndbotFid].includes(
      Number(currentAuction.creatorFid)
    ),
    settledAt: block.timestamp,
    blockNumber: block.number,
    transactionHash: transaction.hash,
  });

  // Update user stats for winner
  await updateUserStats(context, winner, winnerFid, {
    auctionsWon: 1,
    totalAmountWon: amount,
    timestamp: block.timestamp,
  });

  // Update user stats for creator
  await updateUserStats(
    context,
    currentAuction.creator,
    currentAuction.creatorFid,
    {
      successfulAuctions: 1,
      totalCreatorEarnings: creatorAmount,
      timestamp: block.timestamp,
    }
  );

  // Update daily stats
  await updateDailyStats(context, block.timestamp, {
    auctionsSettled: 1,
    protocolFees: treasuryAmount,
  });

  // Legacy tables for backward compatibility
  await context.db.insert(auctionSettled).values({
    id: castHash,
    castHash,
    winner,
    winnerFid,
    amount,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    transactionHash: transaction.hash,
  });

  // Update BRND collector stats if this is a brndbot cast
  if (currentAuction.creatorFid === BRNDBOT_FID) {
    const collectorId = winner.toLowerCase();
    const existingCollector = await context.db.find(brndCollector, {
      id: collectorId,
    });

    if (existingCollector) {
      await context.db.delete(brndCollector, { id: collectorId });
      await context.db.insert(brndCollector).values({
        id: collectorId,
        winner: existingCollector.winner,
        winnerFid: existingCollector.winnerFid,
        totalCollected: existingCollector.totalCollected + 1,
        totalAmountSpent: existingCollector.totalAmountSpent + amount,
        firstCollectionTimestamp: existingCollector.firstCollectionTimestamp,
        lastCollectionTimestamp: block.timestamp,
      });
    } else {
      await context.db.insert(brndCollector).values({
        id: collectorId,
        winner,
        winnerFid,
        totalCollected: 1,
        totalAmountSpent: amount,
        firstCollectionTimestamp: block.timestamp,
        lastCollectionTimestamp: block.timestamp,
      });
    }
  }
});

// Auction Cancelled Event
ponder.on("Auction:AuctionCancelled", async ({ event, context }) => {
  const { castHash, refundedBidder, refundedBidderFid, authorizer } =
    event.args;
  const { block } = event;

  // Update auction as cancelled
  const currentAuction = await context.db.find(auction, { id: castHash });
  if (!currentAuction) return;

  await context.db.delete(auction, { id: castHash });
  await context.db.insert(auction).values({
    ...currentAuction,
    state: 4, // Cancelled
  });

  // Update daily stats
  await updateDailyStats(context, block.timestamp, {
    auctionsCancelled: 1,
  });
});
