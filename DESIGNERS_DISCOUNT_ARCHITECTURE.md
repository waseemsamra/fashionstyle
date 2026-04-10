# Designers On Discount - Architecture Options Analysis

## Current Implementation (❌ Inefficient)

### How It Works Now
```
┌─────────────────────────────────────────────────────────┐
│ Home Page: DesignersOnDiscount Component                │
└─────────────────────────────────────────────────────────┘
                         ↓
          GET /products?limit=50
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Lambda: Scan products with filter                       │
│ - Reads 150 items from DynamoDB (limit × 3)            │
│ - Filters: entityType = 'PRODUCT'                      │
│ - Client-side: filter by isDesignersDiscount flag      │
└─────────────────────────────────────────────────────────┘
                         ↓
          Returns ~8-20 products
```

### Problems
1. **Scans 150 items** to find 8-20 products (87% waste)
2. **Client-side filtering** after downloading data
3. **isDesignersDiscount flag** scattered across product records
4. **No dedicated collection** - relies on boolean flag
5. **With 30K products**: Will scan more, slower responses

**Current Performance**: ~300-500ms per request
**At 30K products**: ~800ms-1.5s per request (degrading)

---

## Option 1: ✅ Separate DynamoDB Table (RECOMMENDED)

### Architecture
Create a dedicated table for curated collections:

```
Table: fashionstore-collections
┌──────────────────────────────────────────────────────┐
│ PK              │ SK              │ Data            │
├──────────────────────────────────────────────────────┤
│ COLLECTION#     │ COLLECTION#     │ {               │
│ designersDiscount│designersDiscount│   name: "...",  │
│                 │                 │   products: [   │
│                 │                 │     "prod-1",   │
│                 │                 │     "prod-2"    │
│                 │                 │   ],            │
│                 │                 │   updatedAt: "" │
│                 │                 │ }               │
└──────────────────────────────────────────────────────┘
```

### How It Works
```
┌─────────────────────────────────────────────────────────┐
│ Home Page: DesignersOnDiscount Component                │
└─────────────────────────────────────────────────────────┘
                         ↓
          GET /collections/designersDiscount
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Lambda: collectionsHandler.js                           │
│ - Single GetItem call (O(1))                           │
│ - Returns: { products: ["prod-1", "prod-2", ...] }    │
└─────────────────────────────────────────────────────────┘
                         ↓
          Product IDs: ["prod-1", "prod-2", ...]
                         ↓
┌─────────────────────────────────────────────────────────┐
│ BatchGetItem (up to 100 products at once)              │
│ - 1 API call gets all 8-20 product details             │
│ - Extremely fast: 50-100ms                             │
└─────────────────────────────────────────────────────────┘
```

### Implementation

**1. New Lambda: `collectionsHandler.js`**
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.COLLECTIONS_TABLE || 'fashionstore-collections';

exports.handler = async (event) => {
  const path = event.path;
  const method = event.httpMethod;

  // GET /collections/:name - Get collection
  if (path.match(/^\/collections\/[^/]+$/) && method === 'GET') {
    const collectionName = path.split('/')[2];
    
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `COLLECTION#${collectionName}`,
        SK: `COLLECTION#${collectionName}`
      }
    };

    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Not found' }) };
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result.Item) };
  }

  // POST /collections/:name - Save/Update collection
  if (path.match(/^\/collections\/[^/]+$/) && method === 'POST') {
    const collectionName = path.split('/')[2];
    const body = JSON.parse(event.body);

    const params = {
      TableName: TABLE_NAME,
      Item: {
        PK: `COLLECTION#${collectionName}`,
        SK: `COLLECTION#${collectionName}`,
        entityType: 'COLLECTION',
        name: collectionName,
        products: body.products || [],
        metadata: body.metadata || {},
        updatedAt: new Date().toISOString()
      }
    };

    await dynamodb.put(params).promise();

    return { 
      statusCode: 200, 
      headers: CORS_HEADERS, 
      body: JSON.stringify({ message: 'Collection saved', products: body.products }) 
    };
  }
};
```

**2. Frontend: Save Collection**
```typescript
// DesignersDiscountCMS.tsx - handleSave()
const handleSave = async () => {
  // Save collection metadata (just product IDs)
  await fetch(`${API_URL}/collections/designersDiscount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      products: selectedProductIds,  // ["prod-1", "prod-2", ...]
      metadata: {
        brands: selectedBrands,
        updatedAt: new Date().toISOString()
      }
    })
  });
};
```

**3. Frontend: Load Collection**
```typescript
// DesignersOnDiscount.tsx - loadProducts()
const loadProducts = async () => {
  // Step 1: Get collection (product IDs only)
  const collectionResp = await fetch(`${API_URL}/collections/designersDiscount`);
  const collection = await collectionResp.json();
  
  // Step 2: Batch get product details (up to 100 at once)
  const productIds = collection.products; // ["prod-1", "prod-2", ...]
  
  const productsResp = await fetch(`${API_URL}/products/batch`, {
    method: 'POST',
    body: JSON.stringify({ ids: productIds })
  });
  const products = await productsResp.json();
  
  setProducts(products);
};
```

### Pros
| Aspect | Details |
|--------|---------|
| ✅ **Performance** | 50-100ms response time (5-10x faster than current) |
| ✅ **Scalability** | Same speed at 30K, 50K, 100K products |
| ✅ **Cost** | 1 GetItem + 1 BatchGetItem = ~$0.000004 per request |
| ✅ **Simplicity** | Clean separation of concerns |
| ✅ **Flexibility** | Easy to add more collections (Featured, New Arrivals, etc.) |
| ✅ **Atomicity** | Entire collection saved in one operation |
| ✅ **No duplication** | Product details stored once, referenced by ID |

### Cons
| Aspect | Details |
|--------|---------|
| ⚠️ **New table** | Requires creating `fashionstore-collections` table |
| ⚠️ **New Lambda** | Requires `collectionsHandler.js` Lambda function |
| ⚠️ **2 API calls** | Get collection + BatchGetItem (but still very fast) |

### Cost Analysis (30K products, 100K requests/month)
- **Current approach**: Scan 150 items × 100K requests = 15M read units = ~$3.75/month
- **Separate table**: 1 GetItem + 1 BatchGetItem × 100K = ~$0.40/month
- **Savings**: 89% cheaper

---

## Option 2: 🔶 Single Table Design with GSI

### Architecture
Use same products table but create a Global Secondary Index:

```
Table: fashionstore-data
GSI: collection-index (partitionKey: collectionName, sortKey: updatedAt)

┌──────────────────────────────────────────────────────────┐
│ PK          │ SK          │ collectionName    │ ...      │
├──────────────────────────────────────────────────────────┤
│ PROD#1      │ PROD#1      │ designersDiscount │ (product)│
│ PROD#2      │ PROD#2      │ designersDiscount │ (product)│
│ PROD#3      │ PROD#3      │ null              │ (product)│
│ PROD#4      │ PROD#4      │ featured          │ (product)│
└──────────────────────────────────────────────────────────┘
```

### How It Works
```
GET /products?collection=designersDiscount
         ↓
Lambda: Query collection-index
  - KeyCondition: collectionName = 'designersDiscount'
  - Returns only matching products
         ↓
Returns 8-20 products directly
```

### Implementation

**Lambda Update:**
```javascript
// GET /products?collection=designersDiscount
if (collection) {
  const queryParams = {
    TableName: TABLE_NAME,
    IndexName: 'collection-index',
    KeyConditionExpression: 'collectionName = :collection',
    ExpressionAttributeValues: { ':collection': collection },
    Limit: parseInt(limit)
  };
  
  const result = await dynamodb.query(queryParams).promise();
  return { statusCode: 200, body: JSON.stringify({ items: result.Items }) };
}
```

### Pros
| Aspect | Details |
|--------|---------|
| ✅ **Single table** | No new tables needed |
| ✅ **Fast queries** | Query is 10-100x faster than Scan |
| ✅ **1 API call** | Direct query returns products |
| ✅ **Built-in filtering** | Can combine with other filters |

### Cons
| Aspect | Details |
|--------|---------|
| ❌ **Data duplication** | Every product stores `collectionName` field |
| ❌ **Update overhead** | Removing product from collection requires updating product record |
| ❌ **GSI cost** | GSI writes cost extra (~$0.0000025 per write) |
| ❌ **Not truly separate** | Still mixing collection logic with product data |
| ❌ **Limited flexibility** | Can't store collection metadata separately |

### Cost Analysis
- **GSI writes**: 8 products × 2x (add + remove) = 16 write units per save
- **GSI storage**: Duplicate of collectionName field × 30K products
- **Query reads**: ~1-2 read units per request = cheaper than Scan
- **Overall**: Slightly cheaper than current, but more expensive than Option 1

---

## Option 3: 🔶 DynamoDB Set Attribute with Query

### Architecture
Store collection as a Set in a separate "metadata" item:

```
Table: fashionstore-data

┌──────────────────────────────────────────────────────────┐
│ PK                    │ SK                    │ Data     │
├──────────────────────────────────────────────────────────┤
│ COLLECTION#           │ COLLECTION#           │ {        │
│ designersDiscount     │ designersDiscount     │   type:  │
│                       │                       │   "SET", │
│                       │                       │   items: │
│                       │                       │   ["p1", │
│                       │                       │    "p2"] │
│                       │                       │ }        │
├──────────────────────────────────────────────────────────┤
│ PROD#1                │ PROD#1                │ {...}    │
│ PROD#2                │ PROD#2                │ {...}    │
└──────────────────────────────────────────────────────────┘
```

### How It Works
Same as Option 1, but uses same table instead of separate table.

### Pros
| Aspect | Details |
|--------|---------|
| ✅ **Same table** | No new table creation needed |
| ✅ **Simple** | Just add new item type to existing table |
| ✅ **Fast** | Single GetItem for collection IDs |

### Cons
| Aspect | Details |
|--------|---------|
| ❌ **Table bloat** | Mixing collections with products |
| ❌ **BatchGet needed** | Still need second call for product details |
| ⚠️ **Same as Option 1** | Basically Option 1 but same table |

---

## Option 4: 🔷 Redis/ElastiCache (Overkill for This Use Case)

### Architecture
Use Redis to cache collection product IDs:

```
┌─────────────────────────────────────────────────────────┐
│ ElastiCache Redis                                       │
├─────────────────────────────────────────────────────────┤
│ Key: collection:designersDiscount                       │
│ Value: ["prod-1", "prod-2", "prod-3", ...]              │
│ TTL: 24 hours                                           │
└─────────────────────────────────────────────────────────┘
```

### How It Works
1. Save: `SET collection:designersDiscount '["p1","p2"]' EX 86400`
2. Load: `GET collection:designersDiscount`
3. BatchGet products from DynamoDB

### Pros
| Aspect | Details |
|--------|---------|
| ✅ **Fastest** | <10ms response time |
| ✅ **Auto-expiry** | TTL for automatic cleanup |
| ✅ **Atomic operations** | SADD, SREM for atomic updates |

### Cons
| Aspect | Details |
|--------|---------|
| ❌ **Expensive** | ElastiCache minimum: ~$15/month |
| ❌ **Complex** | New infrastructure to manage |
| ❌ **Overkill** | DynamoDB is fast enough for this use case |
| ❌ **Not persistent** | Cache misses require rebuild |

### When to Use
- 1M+ requests per day
- Sub-10ms response time requirement
- Already using Redis for other features

---

## Option 5: 🔷 S3 JSON File (Simple but Limited)

### Architecture
Store collection as a JSON file in S3:

```
S3 Bucket: fashionstore-collections
├── designersDiscount.json
│   {
│     "products": ["prod-1", "prod-2", ...],
│     "updatedAt": "2024-01-01T00:00:00Z"
│   }
├── featured.json
└── newArrivals.json
```

### How It Works
1. Save: PUT JSON to S3
2. Load: GET JSON from S3 (CloudFront cached)
3. BatchGet products from DynamoDB

### Pros
| Aspect | Details |
|--------|---------|
| ✅ **Simple** | Just file I/O |
| ✅ **Cheap** | ~$0.023/GB/month storage |
| ✅ **CDN cacheable** | CloudFront can cache for hours |
| ✅ **No new services** | Already using S3 |

### Cons
| Aspect | Details |
|--------|---------|
| ❌ **Eventually consistent** | S3 has eventual consistency |
| ❌ **Cold starts** | First load after update slower |
| ❌ **Not real-time** | CDN cache invalidation needed |
| ❌ **Concurrency issues** | Multiple saves can overwrite |

---

## Comparison Matrix

| Feature | Option 1: Separate Table | Option 2: GSI | Option 3: Same Table Set | Option 4: Redis | Option 5: S3 JSON |
|---------|-------------------------|---------------|--------------------------|-----------------|-------------------|
| **Speed** | 50-100ms ⭐⭐⭐⭐ | 30-80ms ⭐⭐⭐⭐⭐ | 50-100ms ⭐⭐⭐⭐ | <10ms ⭐⭐⭐⭐⭐ | 100-500ms ⭐⭐ |
| **Scalability** | Perfect ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ | Perfect ⭐⭐⭐⭐⭐ | Perfect ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐⭐ |
| **Cost/month (100K req)** | ~$0.40 ⭐⭐⭐⭐⭐ | ~$1.50 ⭐⭐⭐⭐ | ~$0.50 ⭐⭐⭐⭐⭐ | ~$15.00 ⭐⭐ | ~$0.30 ⭐⭐⭐⭐⭐ |
| **Implementation Effort** | Medium ⭐⭐⭐ | Medium ⭐⭐⭐ | Low ⭐⭐ | High ⭐⭐⭐⭐⭐ | Low ⭐⭐ |
| **Maintenance** | Low ⭐⭐ | Medium ⭐⭐⭐ | Low ⭐⭐ | High ⭐⭐⭐⭐ | Low ⭐⭐ |
| **Flexibility** | High ⭐⭐⭐⭐⭐ | Medium ⭐⭐⭐ | Medium ⭐⭐⭐ | High ⭐⭐⭐⭐ | Low ⭐⭐ |
| **Data Integrity** | High ⭐⭐⭐⭐⭐ | Medium ⭐⭐⭐ | High ⭐⭐⭐⭐ | Low ⭐⭐ | Medium ⭐⭐⭐ |
| **Real-time Updates** | Yes ⭐⭐⭐⭐⭐ | Yes ⭐⭐⭐⭐⭐ | Yes ⭐⭐⭐⭐⭐ | Yes ⭐⭐⭐⭐⭐ | No ⭐⭐ |

---

## Recommendation: **Option 1 - Separate Table** ⭐⭐⭐⭐⭐

### Why?

1. **Best balance of cost, speed, and maintainability**
2. **Clean separation of concerns** - collections are different from products
3. **Extremely scalable** - works for 10 products or 10M products
4. **Easy to extend** - add Featured, New Arrivals, Seasonal collections
5. **Industry standard pattern** - used by Shopify, Magento, etc.

### Implementation Plan

```
Phase 1: Setup (1-2 hours)
├── Create fashionstore-collections DynamoDB table
├── Deploy collectionsHandler.js Lambda
└── Connect to API Gateway

Phase 2: Migration (2-3 hours)
├── Update DesignersDiscountCMS.tsx to save to collection
├── Update DesignersOnDiscount.tsx to load from collection
├── Add batch product fetch endpoint
└── Test end-to-end

Phase 3: Cleanup (1 hour)
├── Remove isDesignersDiscount flag from products
├── Update admin UI
└── Monitor and optimize

Total Time: 4-6 hours
```

### Expected Results

| Metric | Current | After Option 1 | Improvement |
|--------|---------|----------------|-------------|
| Response Time | 300-500ms | 50-100ms | **5-10x faster** |
| Cost/month (100K req) | ~$3.75 | ~$0.40 | **89% cheaper** |
| Scan Efficiency | 13% (150→20) | 100% (direct) | **7.7x better** |
| At 30K Products | Degrades | **Same speed** | Perfect scaling |

---

## Bonus: Future-Proofing

With Option 1, you can easily add:

```
Collections you can add later:
├── designersDiscount
├── featuredCollection
├── newArrivals
├── weddingTales
├── seasonalSummer
├── flashSale
├── editorPicks
└── trendingNow
```

All use the same pattern, no new infrastructure needed!

---

## Next Steps

**If you choose Option 1** (recommended):
1. I'll create the DynamoDB table creation script
2. I'll write the `collectionsHandler.js` Lambda
3. I'll update the frontend components
4. I'll add API Gateway routes
5. I'll create a migration script for existing data

**Just say "implement Option 1" and I'll do it!** 🚀
