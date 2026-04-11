// categoriesHandler.js - Returns category names and counts efficiently
// NO need to fetch all products - uses DynamoDB scan with projection

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'products-prod';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  console.log('Categories Handler:', event.path, event.httpMethod);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: 'OK' }) };
  }

  try {
    if (event.path === '/categories' && event.httpMethod === 'GET') {
      return await getCategories();
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Not found' }),
    };
  } catch (error) {
    console.error('Categories Handler Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

/**
 * GET /categories - Get all categories with product counts
 * Efficient: Only scans category field, not full products
 * Caches results for 5 minutes to avoid repeated scans
 */
let cachedCategories = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCategories() {
  // Return cached data if still valid
  const now = Date.now();
  if (cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('⚡ Returning cached categories');
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({
        categories: cachedCategories,
        total: cachedCategories.length,
        cached: true,
      }),
    };
  }

  console.log('📊 Scanning products for categories...');

  // Scan ONLY the category field - much faster than full product scan
  const command = new ScanCommand({
    TableName: PRODUCTS_TABLE,
    ProjectionExpression: '#cat',
    ExpressionAttributeNames: { '#cat': 'category' },
  });

  const categoryCounts = {};
  let lastEvaluatedKey = null;
  let totalScanned = 0;

  do {
    if (lastEvaluatedKey) {
      command.input.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await dynamodb.send(command);
    totalScanned += result.Count || 0;
    lastEvaluatedKey = result.LastEvaluatedKey;

    // Count categories
    result.Items?.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Safety limit - stop after 100K items
    if (totalScanned > 100000) {
      console.warn('⚠️ Stopping scan at 100K items for performance');
      break;
    }
  } while (lastEvaluatedKey);

  console.log(`📊 Scanned ${totalScanned} items, found ${Object.keys(categoryCounts).length} categories`);

  // Convert to array and sort by count
  cachedCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  cacheTimestamp = now;

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' },
    body: JSON.stringify({
      categories: cachedCategories,
      total: cachedCategories.length,
      scanned: totalScanned,
    }),
  };
}
