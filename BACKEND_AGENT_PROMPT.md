# Backend Agent Prompt for StoriesInMotionV5 Indexer Integration

## Overview
You are a backend agent responsible for handling incoming webhook data from the StoriesInMotionV5 Ponder indexer. The indexer monitors the StoriesInMotionV5 smart contract on Base chain and sends structured data to your endpoints.

## Authentication
All incoming requests will include:
- **Authorization Header**: `Bearer {INDEXER_API_KEY}`
- **Custom Header**: `X-Indexer-Source: ponder-stories-in-motion-v5`

Verify that the `Authorization` header matches your environment variable `INDEXER_API_KEY` before processing any requests.

## Endpoints to Handle

### 1. POST `/blockchain-service/submit-vote`
**Purpose**: Receives real-time vote data when users create podiums on the StoriesInMotionV5 contract.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {INDEXER_API_KEY}
X-Indexer-Source: ponder-stories-in-motion-v5
```

**Request Body Schema**:
```json
{
  "id": "string",                    // Unique vote ID: "{transactionHash}-{logIndex}"
  "voter": "string",                 // Ethereum address (lowercase)
  "fid": "number",                   // Farcaster ID of the voter
  "day": "string",                   // Day number (bigint as string)
  "brandIds": "number[]",            // Array of 3 brand IDs in podium order [1st, 2nd, 3rd]
  "cost": "string",                  // Vote cost in wei (bigint as string)
  "blockNumber": "string",           // Block number (bigint as string)
  "transactionHash": "string",       // Transaction hash
  "timestamp": "string"              // Block timestamp (bigint as string)
}
```

**Example Request Body**:
```json
{
  "id": "0xabc123...-42",
  "voter": "0x1234567890abcdef1234567890abcdef12345678",
  "fid": 12345,
  "day": "19691",
  "brandIds": [1, 2, 3],
  "cost": "100000000000000000000",
  "blockNumber": "8234567",
  "transactionHash": "0xabc123...",
  "timestamp": "1699123456"
}
```

### 2. POST `/blockchain-service/brands`
**Purpose**: Receives brand creation data when new brands are created on the contract.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {INDEXER_API_KEY}
X-Indexer-Source: ponder-stories-in-motion-v5
```

**Request Body Schema**:
```json
{
  "id": "number",                    // Brand ID (uint16)
  "fid": "number",                   // Farcaster ID associated with brand
  "walletAddress": "string",         // Ethereum address (lowercase)
  "handle": "string",                // Brand handle/name
  "createdAt": "string",             // Creation timestamp (bigint as string)
  "blockNumber": "string",           // Block number (bigint as string)
  "transactionHash": "string",       // Transaction hash
  "timestamp": "string"              // Block timestamp (bigint as string)
}
```

**Example Request Body**:
```json
{
  "id": 1,
  "fid": 12345,
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "handle": "awesome-brand",
  "createdAt": "1699123456",
  "blockNumber": "8234567",
  "transactionHash": "0xdef456...",
  "timestamp": "1699123456"
}
```

## Data Processing Guidelines

### For Vote Data (`/submit-vote`):
1. **Validate the request**: Check API key and source header
2. **Parse brand podium**: The `brandIds` array represents the user's podium choice:
   - `brandIds[0]` = 1st place (60% allocation)
   - `brandIds[1]` = 2nd place (30% allocation)  
   - `brandIds[2]` = 3rd place (10% allocation)
3. **Store vote data**: Save to your database with proper indexing on `fid`, `day`, and `voter`
4. **Business logic**: Update any analytics, user stats, or real-time dashboards
5. **Response**: Return 200 OK on success, appropriate error codes on failure

### For Brand Data (`/brands`):
1. **Validate the request**: Check API key and source header
2. **Store brand data**: Save to your brands database/collection
3. **Business logic**: Update brand listings, notify relevant systems
4. **Response**: Return 200 OK on success, appropriate error codes on failure

## Error Handling
- **401 Unauthorized**: Invalid or missing API key
- **400 Bad Request**: Malformed JSON or missing required fields
- **409 Conflict**: Duplicate ID (vote/brand already exists)
- **500 Internal Server Error**: Database or processing errors

## Data Considerations
- All BigInt values are sent as strings to prevent precision loss
- Ethereum addresses are normalized to lowercase
- The indexer ensures data integrity and proper event ordering
- Vote IDs and brand IDs are unique within their respective domains
- Timestamps are Unix timestamps in seconds

## Monitoring & Logging
- Log all incoming requests for debugging
- Track processing times and success/failure rates
- Alert on authentication failures or unusual request patterns
- Monitor for duplicate submissions (shouldn't happen but good to track)

## Example Implementation (Node.js/Express)
```javascript
app.post('/blockchain-service/submit-vote', async (req, res) => {
  // Verify API key
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.INDEXER_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify source
  if (req.headers['x-indexer-source'] !== 'ponder-stories-in-motion-v5') {
    return res.status(400).json({ error: 'Invalid source' });
  }

  try {
    const voteData = req.body;
    
    // Validate required fields
    if (!voteData.id || !voteData.voter || !voteData.fid || !voteData.brandIds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process the vote...
    await processVote(voteData);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

This indexer provides real-time, reliable blockchain data with proper authentication and structured payloads for your backend processing needs.