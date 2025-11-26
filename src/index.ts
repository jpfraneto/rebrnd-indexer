import { ponder } from "ponder:registry";
import { eq } from "ponder";
import {
  brands,
  votes,
  users,
  walletAuthorizations,
  rewardClaims,
  brandRewardWithdrawals,
  brndPowerLevelUps,
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

ponder.on("BRNDSEASON1:PodiumCreated", async ({ event, context }) => {
  const { voter, fid, day, brandIds, cost } = event.args;
  const { block, transaction } = event;

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
  const { recipient, fid, amount, day, castHash, caller } = event.args;
  const { block, transaction } = event;

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
