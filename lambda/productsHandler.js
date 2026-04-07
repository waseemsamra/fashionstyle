// productsHandler.js - Lambda handler for products API
// Handles: GET /products, POST /products, GET /products/:id, etc.

const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'fashionstore-data';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  console.log('Products Handler:', event.path, event.httpMethod);
  console.log('Query params:', event.queryStringParameters);
  console.log('Body:', event.body);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // GET /products - List all products with filtering
    if (path === '/products' && method === 'GET') {
      return await getAllProducts(event);
    }

    // GET /products/:id - Get single product
    if (path.match(/^\/products\/[^/]+$/) && method === 'GET') {
      const productId = path.split('/')[2];
      return await getProductById(productId);
    }

    // POST /products - Create or update product
    if (path === '/products' && method === 'POST') {
      return await createOrUpdateProduct(event);
    }

    // DELETE /products/:id - Delete product
    if (path.match(/^\/products\/[^/]+$/) && method === 'DELETE') {
      const productId = path.split('/')[2];
      return await deleteProduct(productId);
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Not found' }),
    };
  } catch (error) {
    console.error('Products Handler Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

// GET /products with filtering
async function getAllProducts(event) {
  const params = event.queryStringParameters || {};
  const { brand, category, search, limit = '500', page = '1', isActive } = params;

  console.log('🔍 Filters:', { brand, category, search, limit, page, isActive });

  // Scan all products
  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType',
    ExpressionAttributeValues: {
      ':entityType': 'PRODUCT',
    },
  };

  // Add active filter if specified
  if (isActive === 'true') {
    scanParams.FilterExpression += ' AND isActive = :isActive';
    scanParams.ExpressionAttributeValues[':isActive'] = true;
  }

  let allProducts = [];
  let lastEvaluatedKey = null;

  do {
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await dynamodb.scan(scanParams).promise();
    allProducts = allProducts.concat(result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`📦 Total products from DB: ${allProducts.length}`);

  // Apply brand filter (case-insensitive)
  if (brand) {
    const brandLower = brand.toLowerCase().trim();
    const beforeFilter = allProducts.length;
    allProducts = allProducts.filter(p => {
      if (!p.brand) return false;
      const pBrand = p.brand.toLowerCase().trim();
      return pBrand === brandLower || 
             pBrand.includes(brandLower) || 
             brandLower.includes(pBrand) ||
             pBrand.replace(/\s+/g, '') === brandLower.replace(/\s+/g, '');
    });
    console.log(`🔍 After brand filter "${brand}": ${allProducts.length}/${beforeFilter}`);
  }

  // Apply category filter
  if (category && category !== 'all') {
    const categoryLower = category.toLowerCase().trim();
    const beforeFilter = allProducts.length;
    allProducts = allProducts.filter(p => {
      if (!p.category) return false;
      return p.category.toLowerCase().trim() === categoryLower;
    });
    console.log(`🔍 After category filter "${category}": ${allProducts.length}/${beforeFilter}`);
  }

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase().trim();
    const beforeFilter = allProducts.length;
    allProducts = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      return name.includes(searchLower) || 
             description.includes(searchLower) || 
             brand.includes(searchLower);
    });
    console.log(`🔍 After search filter "${search}": ${allProducts.length}/${beforeFilter}`);
  }

  // Pagination
  const limitNum = parseInt(limit);
  const pageNum = parseInt(page);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedProducts = allProducts.slice(startIndex, startIndex + limitNum);

  console.log(`✅ Returning ${paginatedProducts.length} products (page ${pageNum}, limit ${limitNum})`);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      products: paginatedProducts,
      count: paginatedProducts.length,
      total: allProducts.length,
      page: pageNum,
      limit: limitNum,
    }),
  };
}

// GET /products/:id
async function getProductById(productId) {
  console.log('🔍 Getting product:', productId);

  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `PROD#${productId}`,
      SK: `PROD#${productId}`,
    },
  };

  const result = await dynamodb.get(params).promise();

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result.Item),
  };
}

// POST /products - Create or update
async function createOrUpdateProduct(event) {
  const body = JSON.parse(event.body);
  console.log('📝 Creating/Updating product:', body.id || 'new');

  const productId = body.id || `PROD-${Date.now()}`;
  const now = new Date().toISOString();

  const productData = {
    PK: `PROD#${productId}`,
    SK: `PROD#${productId}`,
    entityType: 'PRODUCT',
    id: productId,
    name: body.name || '',
    description: body.description || '',
    price: parseFloat(body.price) || 0,
    originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
    category: body.category || '',
    brand: body.brand || '',
    image: body.image || '',
    images: body.images || [],
    stock: parseInt(body.stock) || 0,
    sku: body.sku || '',
    sizes: body.sizes || [],
    colors: body.colors || [],
    materials: body.materials || [],
    patterns: body.patterns || [],
    occasions: body.occasions || [],
    genders: body.genders || [],
    isActive: body.isActive !== undefined ? body.isActive : true,
    isFeatured: body.isFeatured || false,
    isNew: body.isNew || false,
    isSale: body.isSale || false,
    tags: body.tags || [],
    updatedAt: now,
  };

  // If updating, preserve createdAt
  if (body.id) {
    const existingParams = {
      TableName: TABLE_NAME,
      Key: {
        PK: `PROD#${productId}`,
        SK: `PROD#${productId}`,
      },
    };
    const existing = await dynamodb.get(existingParams).promise();
    if (existing.Item) {
      productData.createdAt = existing.Item.createdAt;
    } else {
      productData.createdAt = now;
    }
  } else {
    productData.createdAt = now;
  }

  const putParams = {
    TableName: TABLE_NAME,
    Item: productData,
  };

  await dynamodb.put(putParams).promise();

  console.log('✅ Product saved:', productId);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      message: body.id ? 'Product updated' : 'Product created',
      product: productData,
    }),
  };
}

// DELETE /products/:id
async function deleteProduct(productId) {
  console.log('🗑️ Deleting product:', productId);

  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `PROD#${productId}`,
      SK: `PROD#${productId}`,
    },
  };

  await dynamodb.delete(params).promise();

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Product deleted' }),
  };
}
