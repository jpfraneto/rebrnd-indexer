import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Enable CORS for all routes
app.use("/*", cors());

// Helper function to convert BigInt to string for JSON serialization
function serializeBigInts(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }
  if (obj !== null && typeof obj === "object") {
    const serialized: any = {};
    for (const key in obj) {
      serialized[key] = serializeBigInts(obj[key]);
    }
    return serialized;
  }
  return obj;
}

// Get auction details by cast hash
app.get("/auction/:castHash", async (c) => {
  const { castHash } = c.req.param();
  const { db } = c.env;

  try {
    const auction = await db
      .selectFrom("auction")
      .selectAll()
      .where("castHash", "=", castHash)
      .executeTakeFirst();

    if (!auction) {
      return c.json({ error: "Auction not found" }, 404);
    }

    return c.json(serializeBigInts(auction));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all bids for an auction
app.get("/auction/:castHash/bids", async (c) => {
  const { castHash } = c.req.param();
  const { db } = c.env;

  try {
    const bids = await db
      .selectFrom("bid")
      .selectAll()
      .where("castHash", "=", castHash)
      .orderBy("bidIndex", "asc")
      .execute();

    return c.json(serializeBigInts(bids));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get auction extensions
app.get("/auction/:castHash/extensions", async (c) => {
  const { castHash } = c.req.param();
  const { db } = c.env;

  try {
    const extensions = await db
      .selectFrom("auctionExtension")
      .selectAll()
      .where("castHash", "=", castHash)
      .orderBy("extensionIndex", "asc")
      .execute();

    return c.json(serializeBigInts(extensions));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user statistics
app.get("/user/:address/stats", async (c) => {
  const { address } = c.req.param();
  const { db } = c.env;

  try {
    const stats = await db
      .selectFrom("userStats")
      .selectAll()
      .where("address", "=", address.toLowerCase())
      .executeTakeFirst();

    if (!stats) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(serializeBigInts(stats));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's auction history as creator
app.get("/user/:address/auctions/created", async (c) => {
  const { address } = c.req.param();
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const auctions = await db
      .selectFrom("auction")
      .selectAll()
      .where("creator", "=", address.toLowerCase())
      .orderBy("startTime", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return c.json(serializeBigInts(auctions));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's auction history as bidder
app.get("/user/:address/auctions/participated", async (c) => {
  const { address } = c.req.param();
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const auctions = await db
      .selectFrom("auction")
      .innerJoin("bid", "auction.castHash", "bid.castHash")
      .select([
        "auction.castHash",
        "auction.creator",
        "auction.creatorFid",
        "auction.state",
        "auction.startTime",
        "auction.endTime",
        "auction.highestBid",
        "auction.highestBidder",
        "auction.settledAt",
      ])
      .where("bid.bidder", "=", address.toLowerCase())
      .groupBy("auction.castHash")
      .orderBy("auction.startTime", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return c.json(serializeBigInts(auctions));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's collectibles (won auctions)
app.get("/user/:address/collectibles", async (c) => {
  const { address } = c.req.param();
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");
  const excludeBrndbot = c.req.query("excludeBrndbot") === "true";

  try {
    let query = db
      .selectFrom("castCollectible")
      .selectAll()
      .where("winner", "=", address.toLowerCase());

    if (excludeBrndbot) {
      query = query.where("isFromBrndbot", "=", false);
    }

    const collectibles = await query
      .orderBy("settledAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return c.json(serializeBigInts(collectibles));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get BRND collectors leaderboard
app.get("/brnd/collectors", async (c) => {
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const collectors = await db
      .selectFrom("brndCollector")
      .selectAll()
      .orderBy("totalCollected", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return c.json(serializeBigInts(collectors));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get recent auctions
app.get("/auctions/recent", async (c) => {
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
  const state = c.req.query("state"); // Filter by state (1=Active, 2=Ended, 3=Settled, 4=Cancelled)

  try {
    let query = db
      .selectFrom("auction")
      .selectAll()
      .orderBy("startTime", "desc")
      .limit(limit);

    if (state) {
      query = query.where("state", "=", parseInt(state));
    }

    const auctions = await query.execute();
    return c.json(serializeBigInts(auctions));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get daily statistics
app.get("/stats/daily", async (c) => {
  const { db } = c.env;
  const days = Math.min(parseInt(c.req.query("days") || "30"), 365);

  try {
    const stats = await db
      .selectFrom("dailyStats")
      .selectAll()
      .orderBy("date", "desc")
      .limit(days)
      .execute();

    return c.json(serializeBigInts(stats));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get platform analytics
app.get("/analytics/overview", async (c) => {
  const { db } = c.env;

  try {
    // Get total counts and volumes
    const [totalAuctions, totalBids, totalVolume, totalUsers, activeAuctions] =
      await Promise.all([
        db
          .selectFrom("auction")
          .select((eb) => eb.fn.countAll().as("count"))
          .executeTakeFirst(),
        db
          .selectFrom("bid")
          .select((eb) => eb.fn.countAll().as("count"))
          .executeTakeFirst(),
        db
          .selectFrom("bid")
          .select((eb) => eb.fn.sum("amount").as("total"))
          .executeTakeFirst(),
        db
          .selectFrom("userStats")
          .select((eb) => eb.fn.countAll().as("count"))
          .executeTakeFirst(),
        db
          .selectFrom("auction")
          .select((eb) => eb.fn.countAll().as("count"))
          .where("state", "=", 1)
          .executeTakeFirst(),
      ]);

    // Get top creators by volume
    const topCreators = await db
      .selectFrom("userStats")
      .select([
        "address",
        "fid",
        "totalCreatorEarnings",
        "totalAuctionsCreated",
        "successfulAuctions",
      ])
      .where("totalAuctionsCreated", ">", 0)
      .orderBy("totalCreatorEarnings", "desc")
      .limit(10)
      .execute();

    // Get top collectors by volume
    const topCollectors = await db
      .selectFrom("userStats")
      .select([
        "address",
        "fid",
        "totalAmountWon",
        "auctionsWon",
        "totalBidsPlaced",
      ])
      .where("auctionsWon", ">", 0)
      .orderBy("totalAmountWon", "desc")
      .limit(10)
      .execute();

    // Get recent high-value auctions
    const recentHighValue = await db
      .selectFrom("auction")
      .selectAll()
      .where("state", "=", 3) // Settled
      .orderBy("highestBid", "desc")
      .limit(10)
      .execute();

    const analytics = {
      totals: {
        auctions: totalAuctions?.count || 0,
        bids: totalBids?.count || 0,
        volume: totalVolume?.total || "0",
        users: totalUsers?.count || 0,
        activeAuctions: activeAuctions?.count || 0,
      },
      topCreators: serializeBigInts(topCreators),
      topCollectors: serializeBigInts(topCollectors),
      recentHighValue: serializeBigInts(recentHighValue),
    };

    return c.json(analytics);
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get trending auctions (most bids in last 24h)
app.get("/auctions/trending", async (c) => {
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "10"), 50);
  const hours = Math.min(parseInt(c.req.query("hours") || "24"), 168); // Max 7 days

  try {
    const cutoffTime = Math.floor(Date.now() / 1000) - hours * 3600;

    const trending = await db
      .selectFrom("auction")
      .innerJoin("bid", "auction.castHash", "bid.castHash")
      .select([
        "auction.castHash",
        "auction.creator",
        "auction.creatorFid",
        "auction.state",
        "auction.startTime",
        "auction.endTime",
        "auction.highestBid",
        "auction.totalBids",
        (eb) => eb.fn.countAll().as("recentBids"),
      ])
      .where("bid.timestamp", ">", cutoffTime.toString())
      .groupBy([
        "auction.castHash",
        "auction.creator",
        "auction.creatorFid",
        "auction.state",
        "auction.startTime",
        "auction.endTime",
        "auction.highestBid",
        "auction.totalBids",
      ])
      .orderBy("recentBids", "desc")
      .limit(limit)
      .execute();

    return c.json(serializeBigInts(trending));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Search auctions by creator FID
app.get("/auctions/by-creator/:fid", async (c) => {
  const { fid } = c.req.param();
  const { db } = c.env;
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const auctions = await db
      .selectFrom("auction")
      .selectAll()
      .where("creatorFid", "=", fid)
      .orderBy("startTime", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return c.json(serializeBigInts(auctions));
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get auction bid history with detailed info
app.get("/auction/:castHash/history", async (c) => {
  const { castHash } = c.req.param();
  const { db } = c.env;

  try {
    const [auction, bids, extensions] = await Promise.all([
      db
        .selectFrom("auction")
        .selectAll()
        .where("castHash", "=", castHash)
        .executeTakeFirst(),
      db
        .selectFrom("bid")
        .selectAll()
        .where("castHash", "=", castHash)
        .orderBy("bidIndex", "asc")
        .execute(),
      db
        .selectFrom("auctionExtension")
        .selectAll()
        .where("castHash", "=", castHash)
        .orderBy("extensionIndex", "asc")
        .execute(),
    ]);

    if (!auction) {
      return c.json({ error: "Auction not found" }, 404);
    }

    const history = {
      auction: serializeBigInts(auction),
      bids: serializeBigInts(bids),
      extensions: serializeBigInts(extensions),
      summary: {
        totalBids: bids.length,
        totalExtensions: extensions.length,
        priceProgression: bids.map((bid) => ({
          bidIndex: bid.bidIndex,
          amount: bid.amount.toString(),
          timestamp: bid.timestamp.toString(),
        })),
      },
    };

    return c.json(history);
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
