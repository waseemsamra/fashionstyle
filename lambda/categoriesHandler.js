// categoriesHandler.js - Categories API with images support
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COLLECTIONS_TABLE || process.env.TABLE_NAME || 'fashionstore-data';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

// Default category images
const DEFAULT_CATEGORY_IMAGES = {
  'Bridal Wear': 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/category-bridal.jpg',
  'Casual Wear': 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/category-casual.jpg',
  'Formal Wear': 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/category-formal.jpg',
  'Accessories': 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/category-accessories.jpg',
  'Festive Collection': 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/category-festive.jpg',
  'Uncategorized': 'https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/product-1.jpg',
};

exports.handler = async (event) => {
  console.log('Categories Handler:', event.path, event.httpMethod);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: 'OK' }) };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // GET /categories - List all categories with counts and images
    if (path === '/categories' && method === 'GET') {
      return await getCategories();
    }

    // GET /categories/:name - Get specific category
    if (path.match(/^\/categories\/[^/]+$/) && method === 'GET') {
      const name = path.split('/')[2];
      return await getCategory(name);
    }

    // POST /categories - Create/update category with image
    if (path === '/categories' && method === 'POST') {
      return await saveCategory(event);
    }

    // DELETE /categories/:name - Delete category
    if (path.match(/^\/categories\/[^/]+$/) && method === 'DELETE') {
      const name = path.split('/')[2];
      return await deleteCategory(name);
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
 * GET /categories - Get all categories with counts from products + images
 */
async function getCategories() {
  console.log('📂 Fetching categories from products...');

  // Scan products to get unique categories with counts
  const scanCommand = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType',
    ExpressionAttributeValues: { ':entityType': 'PRODUCT' },
    Limit: 5000,
    ProjectionExpression: 'category',
  });

  const result = await dynamodb.send(scanCommand);
  const items = result.Items || [];

  // Count categories
  const categoryCounts = {};
  items.forEach(item => {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
  });

  // Check for custom category data (images, descriptions)
  let customCategories = {};
  try {
    const customCmd = new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: 'CATEGORIES', SK: 'CATEGORIES' },
    });
    const customResult = await dynamodb.send(customCmd);
    if (customResult.Item && customResult.Item.categories) {
      customCategories = customResult.Item.categories;
    }
  } catch (e) {
    console.log('No custom category data found');
  }

  // Build categories array with images and counts
  const categories = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
    image: customCategories[name]?.image || DEFAULT_CATEGORY_IMAGES[name] || '',
    description: customCategories[name]?.description || `${count} products`,
  })).sort((a, b) => b.count - a.count);

  console.log(`✅ Found ${categories.length} categories`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      categories,
      total: categories.length,
    }),
  };
}

/**
 * GET /categories/:name - Get specific category info
 */
async function getCategory(name) {
  console.log(`📂 Getting category: ${name}`);

  const decodedName = decodeURIComponent(name);

  // Get custom data
  const getCmd = new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'CATEGORIES', SK: 'CATEGORIES' },
  });
  const result = await dynamodb.send(getCmd);

  const categories = result.Item?.categories || {};
  const category = categories[decodedName] || null;

  if (!category) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Category not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ category: { name: decodedName, ...category } }),
  };
}

/**
 * POST /categories - Create/update category with image and description
 */
async function saveCategory(event) {
  const body = JSON.parse(event.body);
  const { name, image, description } = body;

  console.log(`📂 Saving category: ${name}`);

  // Get current categories data
  const getCmd = new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'CATEGORIES', SK: 'CATEGORIES' },
  });
  const result = await dynamodb.send(getCmd);

  const categories = result.Item?.categories || {};

  // Update or create category
  categories[name] = {
    image: image || '',
    description: description || '',
    updatedAt: new Date().toISOString(),
  };

  // Save back
  const putCmd = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: 'CATEGORIES',
      SK: 'CATEGORIES',
      entityType: 'CATEGORIES_DATA',
      categories,
      updatedAt: new Date().toISOString(),
    },
  });

  await dynamodb.send(putCmd);

  console.log(`✅ Category "${name}" saved`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      message: 'Category saved',
      category: { name, image, description },
    }),
  };
}

/**
 * DELETE /categories/:name - Delete category
 */
async function deleteCategory(name) {
  console.log(`🗑️ Deleting category: ${name}`);

  const decodedName = decodeURIComponent(name);

  // Get current categories
  const getCmd = new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: 'CATEGORIES', SK: 'CATEGORIES' },
  });
  const result = await dynamodb.send(getCmd);

  const categories = result.Item?.categories || {};

  if (categories[decodedName]) {
    delete categories[decodedName];

    // Save back
    const putCmd = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: 'CATEGORIES',
        SK: 'CATEGORIES',
        entityType: 'CATEGORIES_DATA',
        categories,
        updatedAt: new Date().toISOString(),
      },
    });

    await dynamodb.send(putCmd);
  }

  console.log(`✅ Category "${decodedName}" deleted`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Category deleted' }),
  };
}
