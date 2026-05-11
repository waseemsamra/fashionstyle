const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://main.d1l8ayoz0simv1.amplifyapp.com',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// Helper function to create response
function createResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

// Handle CORS preflight
function handleOptions() {
  return createResponse(200, '');
}

// Products handler
async function handleProducts(event) {
  const TABLE_NAME = process.env.TABLE_NAME || 'fashionstore-data';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (httpMethod === 'GET') {
    try {
      const params = event.queryStringParameters || {};
      const category = params.category;
      const brands = params.brands ? params.brands.split(',') : null;
      const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
      const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      const limit = parseInt(params.limit || '50');
      const page = parseInt(params.page || '1');

      let scanParams = {
        TableName: TABLE_NAME,
        Limit: 2000
      };

      const result = await dynamodb.scan(scanParams).promise();
      let products = result.Items || [];

      // Apply filters
      if (category) {
        products = products.filter(p => p.category === category);
      }
      if (brands && brands.length > 0) {
        products = products.filter(p => brands.includes(p.brand));
      }
      if (minPrice !== null) {
        products = products.filter(p => p.price >= minPrice);
      }
      if (maxPrice !== null) {
        products = products.filter(p => p.price <= maxPrice);
      }

      // Sort
      products.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a[sortBy] > b[sortBy] ? 1 : -1;
        } else {
          return a[sortBy] < b[sortBy] ? 1 : -1;
        }
      });

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = products.slice(startIndex, endIndex);

      return createResponse(200, {
        items: paginatedProducts,
        total: products.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(products.length / limit)
      });
    } catch (error) {
      console.error('Products error:', error);
      return createResponse(500, { error: 'Failed to fetch products' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// Categories handler
async function handleCategories(event) {
  const TABLE_NAME = process.env.CATEGORIES_TABLE || 'fashionstore-categories';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (httpMethod === 'GET') {
    try {
      const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
      const categories = result.Items || [];
      
      // Return categories with product counts
      const categoriesWithCounts = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        image: cat.image || '',
        count: cat.count || 0
      }));

      return createResponse(200, categoriesWithCounts);
    } catch (error) {
      console.error('Categories error:', error);
      // Fallback to hardcoded categories if table doesn't exist
      const fallbackCategories = [
        { id: "accessories", name: "Accessories", description: "", count: 0 },
        { id: "bridal-wear", name: "Bridal Wear", description: "", count: 0 },
        { id: "casual-wear", name: "Casual Wear", description: "", count: 0 },
        { id: "festive-collection", name: "Festive Collection", description: "", count: 0 },
        { id: "footwear", name: "Footwear", description: "", count: 0 },
        { id: "formal-wear", name: "Formal Wear", description: "", count: 0 },
        { id: "kids-wear", name: "Kids Wear", description: "", count: 0 },
        { id: "men-wear", name: "Men Wear", description: "", count: 0 },
        { id: "new-arrivals", name: "New Arrivals", description: "", count: 0 },
        { id: "party-wear", name: "Party Wear", description: "", count: 0 },
        { id: "summer-collection", name: "Summer Collection", description: "", count: 0 },
        { id: "winter-collection", name: "Winter Collection", description: "", count: 0 }
      ];
      return createResponse(200, fallbackCategories);
    }
  }
  
  if (httpMethod === 'POST') {
    try {
      const category = JSON.parse(event.body);
      const params = {
        TableName: TABLE_NAME,
        Item: {
          ...category,
          id: category.id || category.name?.toLowerCase().replace(/\s+/g, '-'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      await dynamodb.put(params).promise();
      return createResponse(200, params.Item);
    } catch (error) {
      console.error('Categories POST error:', error);
      return createResponse(500, { error: 'Failed to create/update category' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// Brands handler
async function handleBrands(event) {
  const TABLE_NAME = process.env.BRANDS_TABLE || 'fashionstore-brands';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (httpMethod === 'GET') {
    try {
      const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
      const brands = result.Items || [];
      
      return createResponse(200, brands);
    } catch (error) {
      console.error('Brands error:', error);
      return createResponse(500, { error: 'Failed to fetch brands' });
    }
  }
  
  if (httpMethod === 'POST') {
    try {
      const brand = JSON.parse(event.body);
      const params = {
        TableName: TABLE_NAME,
        Item: {
          ...brand,
          id: brand.id || `brand-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      await dynamodb.put(params).promise();
      return createResponse(200, params.Item);
    } catch (error) {
      console.error('Brands POST error:', error);
      return createResponse(500, { error: 'Failed to create brand' });
    }
  }
  
  if (httpMethod === 'PUT') {
    try {
      const brand = JSON.parse(event.body);
      const params = {
        TableName: TABLE_NAME,
        Key: { id: brand.id },
        UpdateExpression: 'set #name = :name, description = :description, logo = :logo, active = :active, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':name': brand.name,
          ':description': brand.description,
          ':logo': brand.logo,
          ':active': brand.active,
          ':updatedAt': new Date().toISOString()
        }
      };
      
      await dynamodb.update(params).promise();
      return createResponse(200, { ...brand, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Brands PUT error:', error);
      return createResponse(500, { error: 'Failed to update brand' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// Collections handler
async function handleCollections(event) {
  const TABLE_NAME = process.env.COLLECTIONS_TABLE || 'fashionstore-collections';
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (httpMethod === 'GET') {
    try {
      const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
      const collections = result.Items || [];
      
      return createResponse(200, collections);
    } catch (error) {
      console.error('Collections error:', error);
      return createResponse(500, { error: 'Failed to fetch collections' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// Users handler
async function handleUsers(event) {
  const pathParts = (event.path || '').split('/');
  const userId = pathParts[pathParts.length - 1];
  const subPath = pathParts[pathParts.length - 2];
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (subPath === 'profile' && httpMethod === 'GET') {
    // Get user profile
    try {
      const TABLE_NAME = process.env.USERS_TABLE || 'fashionstore-users';
      const params = {
        TableName: TABLE_NAME,
        Key: { userId: userId }
      };
      
      const result = await dynamodb.get(params).promise();
      return createResponse(200, result.Item || {});
    } catch (error) {
      console.error('User profile error:', error);
      return createResponse(500, { error: 'Failed to fetch user profile' });
    }
  }
  
  if (subPath === 'orders' && httpMethod === 'GET') {
    // Get user orders
    try {
      const TABLE_NAME = process.env.ORDERS_TABLE || 'fashionstore-orders';
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      };
      
      const result = await dynamodb.scan(params).promise();
      return createResponse(200, result.Items || []);
    } catch (error) {
      console.error('User orders error:', error);
      return createResponse(500, { error: 'Failed to fetch user orders' });
    }
  }
  
  if (subPath === 'cart' && httpMethod === 'GET') {
    // Get user cart
    try {
      const TABLE_NAME = process.env.CART_TABLE || 'fashionstore-cart';
      const params = {
        TableName: TABLE_NAME,
        Key: { userId: userId }
      };
      
      const result = await dynamodb.get(params).promise();
      return createResponse(200, result.Item || { items: [], total: 0, itemCount: 0 });
    } catch (error) {
      console.error('User cart error:', error);
      return createResponse(500, { error: 'Failed to fetch user cart' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// User orders handler
async function handleUserOrders(event) {
  const pathParts = (event.path || '').split('/');
  const userId = pathParts[pathParts.length - 2]; // Get userId from /users/{userId}/orders
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (httpMethod === 'GET') {
    try {
      const TABLE_NAME = process.env.ORDERS_TABLE || 'fashionstore-orders';
      const params = event.queryStringParameters || {};
      
      let scanParams = {
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      };
      
      // Add date range filtering if provided
      if (params.dateFrom || params.dateTo) {
        let filterExpression = 'userId = :userId';
        let expressionValues = { ':userId': userId };
        
        if (params.dateFrom) {
          filterExpression += ' AND createdAt >= :dateFrom';
          expressionValues[':dateFrom'] = params.dateFrom;
        }
        if (params.dateTo) {
          filterExpression += ' AND createdAt <= :dateTo';
          expressionValues[':dateTo'] = params.dateTo;
        }
        
        scanParams.FilterExpression = filterExpression;
        scanParams.ExpressionAttributeValues = expressionValues;
      }
      
      const result = await dynamodb.scan(scanParams).promise();
      
      // Sort by creation date (newest first)
      const orders = (result.Items || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      return createResponse(200, {
        items: orders,
        total: orders.length,
        currentPage: 1,
        totalPages: 1
      });
    } catch (error) {
      console.error('User orders error:', error);
      return createResponse(500, { error: 'Failed to fetch user orders' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// Reviews handler
async function handleReviews(event) {
  const pathParts = (event.path || '').split('/');
  const productId = pathParts[pathParts.length - 1];
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  
  if (httpMethod === 'GET') {
    try {
      const TABLE_NAME = process.env.REVIEWS_TABLE || 'fashionstore-reviews';
      const params = event.queryStringParameters || {};
      const limit = parseInt(params.limit || '10');
      const sortBy = params.sortBy || 'helpful';
      
      let scanParams = {
        TableName: TABLE_NAME,
        FilterExpression: 'productId = :productId',
        ExpressionAttributeValues: { ':productId': productId }
      };
      
      const result = await dynamodb.scan(scanParams).promise();
      let reviews = result.Items || [];
      
      // Sort reviews
      if (sortBy === 'helpful') {
        reviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
      } else if (sortBy === 'newest') {
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'rating') {
        reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
      
      // Limit results
      reviews = reviews.slice(0, limit);
      
      return createResponse(200, reviews);
    } catch (error) {
      console.error('Reviews error:', error);
      return createResponse(500, { error: 'Failed to fetch reviews' });
    }
  }
  
  return createResponse(405, { error: 'Method not allowed' });
}

// Main handler
exports.handler = async (event) => {
  console.log('🚀 Unified Lambda Handler called:', JSON.stringify(event, null, 2));
  
  // Handle both API Gateway and Lambda Function URL event structures
  const httpMethod = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.http?.method;
  const path = event.path || event.rawPath || '';
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  // Route to appropriate handler
  if (path.startsWith('/products')) {
    return await handleProducts(event);
  } else if (path.startsWith('/categories')) {
    return await handleCategories(event);
  } else if (path.startsWith('/brands')) {
    return await handleBrands(event);
  } else if (path.startsWith('/collections')) {
    return await handleCollections(event);
  } else if (path.startsWith('/users')) {
    // Check if this is a user orders endpoint
    if (path.includes('/orders')) {
      return await handleUserOrders(event);
    }
    return await handleUsers(event);
  } else if (path.startsWith('/reviews')) {
    return await handleReviews(event);
  } else if (path === '/' || path === '') {
    // Root endpoint - return brands
    return await handleBrands(event);
  } else {
    return createResponse(404, { error: 'Endpoint not found' });
  }
};
