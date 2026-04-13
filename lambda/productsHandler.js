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

// GET /products with filtering - OPTIMIZED with GSIs for 30K+ products
async function getAllProducts(event) {
  const params = event.queryStringParameters || {};
  const { brand, category, search, limit = '50', page = '1', isActive, isFeatured, isNew, isSale, tag, occasion } = params;

  console.log('🔍 Filters:', { brand, category, search, limit, page, isActive, isFeatured, isNew, isSale, tag, occasion });

  let allProducts = [];
  
  // ⚡ USE GSI: category-index for fast category queries (10-40x faster than scan)
  if (category && category !== 'all') {
    console.log('⚡ Using category-index GSI for fast query');
    
    const queryParams = {
      TableName: TABLE_NAME,
      IndexName: 'category-index',
      KeyConditionExpression: '#cat = :catVal AND entityType = :entityType',
      ExpressionAttributeNames: { '#cat': 'category' },
      ExpressionAttributeValues: { ':catVal': category, ':entityType': 'PRODUCT' },
      Limit: parseInt(limit) * 3,
    };
    
    let lastEvaluatedKey = null;
    do {
      if (lastEvaluatedKey) queryParams.ExclusiveStartKey = lastEvaluatedKey;
      const result = await dynamodb.query(queryParams).promise();
      allProducts = allProducts.concat(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
      if (allProducts.length >= parseInt(limit) * 2) break;
    } while (lastEvaluatedKey);
    
    console.log(`⚡ Category query returned ${allProducts.length} products (10-40x faster than scan)`);
  } 
  // ⚡ USE brand filter (client-side after scan since no brand GSI)
  else if (brand) {
    console.log('🏷️ Filtering by brand:', brand);
    
    // Use basic scan without brand filter in DynamoDB (contains is case-sensitive)
    // We'll do case-insensitive filtering client-side
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: 'entityType = :entityType',
      ExpressionAttributeValues: { ':entityType': 'PRODUCT' },
      Limit: 1000, // Scan more products to find brand matches
    };

    let lastEvaluatedKey = null;
    do {
      if (lastEvaluatedKey) scanParams.ExclusiveStartKey = lastEvaluatedKey;
      const result = await dynamodb.scan(scanParams).promise();
      
      // Client-side case-insensitive brand filter
      const brandLower = brand.toLowerCase().trim();
      const filtered = result.Items.filter(p => {
        if (!p.brand) return false;
        const pBrand = p.brand.toLowerCase().trim();
        // Match if brand name matches exactly or contains the search term
        return pBrand === brandLower || 
               pBrand.includes(brandLower) || 
               brandLower.includes(pBrand) ||
               pBrand.replace(/\s+/g, '') === brandLower.replace(/\s+/g, '');
      });
      allProducts = allProducts.concat(filtered);
      
      lastEvaluatedKey = result.LastEvaluatedKey;
      // Stop after finding reasonable amount or scanned enough
      if (allProducts.length >= 100 || (result.Items.length === 0 && !lastEvaluatedKey)) break;
    } while (lastEvaluatedKey && allProducts.length < 100);
    
    console.log(`🏷️ Brand filter returned ${allProducts.length} products for "${brand}"`);
  } else {
    // Fallback to scan with filters for unfiltered requests
    console.log('📡 Using filtered scan');
    
    let filterExpression = 'entityType = :entityType';
    let expressionAttributeValues = { ':entityType': 'PRODUCT' };
    let expressionAttributeNames = {};

    // Add GSI-friendly filters
    if (isFeatured === 'true') {
      filterExpression += ' AND isFeatured = :isFeatured';
      expressionAttributeValues[':isFeatured'] = true;
    }
    if (isNew === 'true') {
      filterExpression += ' AND isNew = :isNew';
      expressionAttributeValues[':isNew'] = true;
    }
    if (isSale === 'true') {
      filterExpression += ' AND isSale = :isSale';
      expressionAttributeValues[':isSale'] = true;
    }
    if (isActive === 'true') {
      filterExpression += ' AND isActive = :isActive';
      expressionAttributeValues[':isActive'] = true;
    }
    if (tag) {
      filterExpression += ' AND contains(#tagAttr, :tagValue)';
      expressionAttributeNames['#tagAttr'] = 'tags';
      expressionAttributeValues[':tagValue'] = tag;
    }
    if (occasion) {
      filterExpression += ' AND contains(#occAttr, :occValue)';
      expressionAttributeNames['#occAttr'] = 'occasions';
      expressionAttributeValues[':occValue'] = occasion;
    }

    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: parseInt(limit) * 3,
    };
    
    if (Object.keys(expressionAttributeNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    let lastEvaluatedKey = null;
    do {
      if (lastEvaluatedKey) scanParams.ExclusiveStartKey = lastEvaluatedKey;
      const result = await dynamodb.scan(scanParams).promise();
      allProducts = allProducts.concat(result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
      if (allProducts.length >= parseInt(limit) * 5) break;
    } while (lastEvaluatedKey);
    
    console.log(`📦 Scan returned ${allProducts.length} products`);
  }

  console.log(`📦 Total products from DB (with filters): ${allProducts.length}`);

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
