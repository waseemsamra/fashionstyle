// collectionsHandler.js - Unified Collections API
// Manages product collections for home page sections
// ONE system for Featured, Wedding Tales, Designers Discount, etc.

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

// Collections stored in fashionstore-data table
const COLLECTIONS_TABLE = process.env.COLLECTIONS_TABLE || 'fashionstore-data';

// Products stored in products-prod table with simple {id} key
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'products-prod';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  console.log('Collections Handler:', JSON.stringify(event));

  // Function URL event structure
  const path = event.rawPath || '/';
  const method = event.requestContext?.http?.method || 'GET';

  console.log('Path:', path, 'Method:', method);

  // Handle CORS preflight FIRST
  if (method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  try {

    // GET /collections - List all collections
    if (path === '/collections' && method === 'GET') {
      return await getAllCollections();
    }

    // GET /collections/:name - Get specific collection with products
    if (path.match(/^\/collections\/[^/]+$/) && method === 'GET') {
      const parts = path.split('/');
      const collectionName = parts[2];
      return await getCollection(collectionName);
    }

    // POST /collections/:name - Create/Update collection
    if (path.match(/^\/collections\/[^/]+$/) && method === 'POST') {
      const parts = path.split('/');
      const collectionName = parts[2];
      return await saveCollection(collectionName, event);
    }

    // DELETE /collections/:name - Delete collection
    if (path.match(/^\/collections\/[^/]+$/) && method === 'DELETE') {
      const parts = path.split('/');
      const collectionName = parts[2];
      return await deleteCollection(collectionName);
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Not found' }),
    };
  } catch (error) {
    console.error('Collections Handler Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

/**
 * GET /collections - List all collections
 */
async function getAllCollections() {
  const command = new ScanCommand({
    TableName: COLLECTIONS_TABLE,
    FilterExpression: 'entityType = :entityType',
    ExpressionAttributeValues: {
      ':entityType': 'COLLECTION'
    }
  });

  const result = await dynamodb.send(command);

  const collections = result.Items.map(item => ({
    id: item.id,
    name: item.name,
    displayName: item.displayName,
    productCount: item.productIds ? item.productIds.length : 0,
    updatedAt: item.updatedAt,
    metadata: item.metadata || {}
  }));

  console.log(`📦 Found ${collections.length} collections`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      collections,
      count: collections.length
    }),
  };
}

/**
 * GET /collections/:name - Get collection with product details
 * Fetches products from products-prod table
 */
async function getCollection(collectionName) {
  console.log(`🔍 Getting collection: ${collectionName}`);

  // Step 1: Get collection metadata
  const command = new GetCommand({
    TableName: COLLECTIONS_TABLE,
    Key: {
      PK: `COLLECTION#${collectionName}`,
      SK: `COLLECTION#${collectionName}`
    }
  });

  const result = await dynamodb.send(command);

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Collection not found',
        collection: collectionName,
        products: []
      }),
    };
  }

  const productIds = result.Item.productIds || [];
  console.log(`✅ Collection found: ${productIds.length} products`);

  // Step 2: If no products, return early
  if (productIds.length === 0) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        collection: result.Item,
        products: []
      }),
    };
  }

  // Step 3: Batch get all products from products-prod table
  const products = await batchGetProducts(productIds);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      collection: result.Item,
      products: products,
      count: products.length
    }),
  };
}

/**
 * POST /collections/:name - Create/Update collection
 * Saves ONLY product IDs - extremely fast and efficient
 */
async function saveCollection(collectionName, event) {
  const body = JSON.parse(event.body);
  console.log(`📝 Saving collection: ${collectionName} with ${body.productIds?.length || 0} products`);

  const now = new Date().toISOString();

  // Check if collection exists
  const existingCommand = new GetCommand({
    TableName: COLLECTIONS_TABLE,
    Key: {
      PK: `COLLECTION#${collectionName}`,
      SK: `COLLECTION#${collectionName}`
    }
  });
  const existing = await dynamodb.send(existingCommand);

  const collectionData = {
    PK: `COLLECTION#${collectionName}`,
    SK: `COLLECTION#${collectionName}`,
    entityType: 'COLLECTION',
    id: collectionName,
    name: collectionName,
    displayName: body.displayName || collectionName,
    productIds: body.productIds || [],
    description: body.description || '',
    metadata: body.metadata || {},
    createdAt: existing.Item?.createdAt || now,
    updatedAt: now,
  };

  const putCommand = new PutCommand({
    TableName: COLLECTIONS_TABLE,
    Item: collectionData
  });

  await dynamodb.send(putCommand);

  console.log(`✅ Collection saved: ${collectionName} with ${collectionData.productIds.length} products`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      message: existing.Item ? 'Collection updated' : 'Collection created',
      collection: collectionData,
      productCount: collectionData.productIds.length
    }),
  };
}

/**
 * DELETE /collections/:name - Delete collection
 */
async function deleteCollection(collectionName) {
  console.log(`🗑️ Deleting collection: ${collectionName}`);

  const command = new DeleteCommand({
    TableName: COLLECTIONS_TABLE,
    Key: {
      PK: `COLLECTION#${collectionName}`,
      SK: `COLLECTION#${collectionName}`
    }
  });

  await dynamodb.send(command);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Collection deleted' }),
  };
}

/**
 * Batch get products by IDs from products-prod table
 * Uses simple {id} key structure (not PK/SK)
 */
async function batchGetProducts(productIds) {
  if (productIds.length === 0) return [];

  const products = [];

  // BatchGetItem can handle up to 100 items at once
  for (let i = 0; i < productIds.length; i += 100) {
    const batch = productIds.slice(i, i + 100);

    console.log(`📦 Batch ${Math.floor(i/100) + 1}: Fetching ${batch.length} products from ${PRODUCTS_TABLE}`);

    const command = new BatchGetCommand({
      RequestItems: {
        [PRODUCTS_TABLE]: {
          Keys: batch.map(id => ({ id }))  // Simple {id} key structure
        }
      }
    });

    const result = await dynamodb.send(command);
    const batchProducts = result.Responses[PRODUCTS_TABLE] || [];
    products.push(...batchProducts);

    console.log(`📦 Batch ${Math.floor(i/100) + 1}: Retrieved ${batchProducts.length} products`);
  }

  return products;
}
