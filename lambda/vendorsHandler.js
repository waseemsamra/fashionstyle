// vendorsHandler.js - Lambda handler for vendor management CRUD
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'fashionstore-data';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  console.log('Vendors Handler:', event.path, event.httpMethod);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '{}' };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;
    const pathParts = path.split('/').filter(Boolean); // ['admin', 'vendors', 'id', 'orders']

    // ===== GET /admin/vendors - List all vendors =====
    if (path === '/admin/vendors' && method === 'GET') {
      return await getAllVendors(event);
    }

    // ===== POST /admin/vendors - Create vendor =====
    if (path === '/admin/vendors' && method === 'POST') {
      return await createVendor(event);
    }

    // ===== PATCH /admin/vendors/:id - Update vendor =====
    if (path.match(/^\/admin\/vendors\/[^/]+$/) && method === 'PATCH') {
      const vendorId = pathParts[2];
      return await updateVendor(vendorId, event);
    }

    // ===== DELETE /admin/vendors/:id - Delete vendor =====
    if (path.match(/^\/admin\/vendors\/[^/]+$/) && method === 'DELETE') {
      const vendorId = pathParts[2];
      return await deleteVendor(vendorId);
    }

    // ===== GET /admin/vendors/:id - Get single vendor =====
    if (path.match(/^\/admin\/vendors\/[^/]+$/) && method === 'GET') {
      const vendorId = pathParts[2];
      return await getVendorById(vendorId);
    }

    // ===== GET /admin/vendors/:id/orders =====
    if (path.match(/^\/admin\/vendors\/[^/]+\/orders$/) && method === 'GET') {
      const vendorId = pathParts[2];
      return await getVendorOrders(vendorId, event);
    }

    // ===== POST /admin/vendors/:id/notify =====
    if (path.match(/^\/admin\/vendors\/[^/]+\/notify$/) && method === 'POST') {
      return await notifyVendor(event);
    }

    // ===== POST /admin/orders/:orderId/status =====
    if (path.match(/^\/admin\/orders\/[^/]+\/status$/) && method === 'PATCH') {
      return await updateOrderStatus(event);
    }

    // ===== GET /admin/inventory/low-stock =====
    if (path === '/admin/inventory/low-stock' && method === 'GET') {
      return await getLowStockAlerts(event);
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Not found' }),
    };
  } catch (error) {
    console.error('Vendors Handler Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

// ===== HELPER FUNCTIONS =====

function createSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// ===== CRUD OPERATIONS =====

// GET /admin/vendors
async function getAllVendors(event) {
  const params = event.queryStringParameters || {};
  const { status, search, brand, limit = '100', page = '1' } = params;

  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType',
    ExpressionAttributeValues: { ':entityType': 'VENDOR' },
  };

  let allVendors = [];
  let lastEvaluatedKey = null;

  do {
    if (lastEvaluatedKey) scanParams.ExclusiveStartKey = lastEvaluatedKey;
    const result = await dynamodb.scan(scanParams).promise();
    allVendors = allVendors.concat(result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  // Filter by status
  if (status && status !== 'all') {
    allVendors = allVendors.filter(v => v.status === status);
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    allVendors = allVendors.filter(v =>
      v.name?.toLowerCase().includes(searchLower) ||
      v.email?.toLowerCase().includes(searchLower) ||
      v.brands?.some(b => b.toLowerCase().includes(searchLower))
    );
  }

  // Filter by brand
  if (brand) {
    allVendors = allVendors.filter(v =>
      v.brands?.some(b => b.toLowerCase() === brand.toLowerCase())
    );
  }

  // Pagination
  const limitNum = parseInt(limit);
  const pageNum = parseInt(page);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = allVendors.slice(startIndex, startIndex + limitNum);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      vendors: paginated,
      count: paginated.length,
      total: allVendors.length,
    }),
  };
}

// POST /admin/vendors
async function createVendor(event) {
  const body = JSON.parse(event.body);
  const vendorId = `VENDOR-${Date.now().toString().slice(-8)}`;
  const now = new Date().toISOString();

  const vendor = {
    PK: `VENDOR#${vendorId}`,
    SK: `VENDOR#${vendorId}`,
    entityType: 'VENDOR',
    id: vendorId,
    name: body.name || '',
    slug: createSlug(body.name),
    email: body.email || '',
    phone: body.phone || '',
    contactPerson: body.contactPerson || '',
    address: body.address || '',
    city: body.city || '',
    country: body.country || '',
    website: body.website || '',
    description: body.description || '',
    logo: body.logo || '',
    brands: body.brands || [],
    categories: body.categories || [],
    status: body.status || 'active',
    commissionRate: body.commissionRate || 0,
    paymentTerms: body.paymentTerms || 'Net 30',
    bankDetails: body.bankDetails || {},
    taxInfo: body.taxInfo || {},
    metrics: {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      averageRating: 0,
      responseTime: 0,
    },
    createdAt: now,
    updatedAt: now,
    notes: body.notes || '',
  };

  await dynamodb.put({ TableName: TABLE_NAME, Item: vendor }).promise();

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Vendor created', vendor }),
  };
}

// PATCH /admin/vendors/:id
async function updateVendor(vendorId, event) {
  const body = JSON.parse(event.body);

  const getParams = {
    TableName: TABLE_NAME,
    Key: { PK: `VENDOR#${vendorId}`, SK: `VENDOR#${vendorId}` },
  };

  const result = await dynamodb.get(getParams).promise();
  if (!result.Item) {
    return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Vendor not found' }) };
  }

  const vendor = { ...result.Item, ...body, updatedAt: new Date().toISOString() };

  await dynamodb.put({ TableName: TABLE_NAME, Item: vendor }).promise();

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Vendor updated', vendor }),
  };
}

// DELETE /admin/vendors/:id
async function deleteVendor(vendorId) {
  const params = {
    TableName: TABLE_NAME,
    Key: { PK: `VENDOR#${vendorId}`, SK: `VENDOR#${vendorId}` },
  };

  await dynamodb.delete(params).promise();

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Vendor deleted' }),
  };
}

// GET /admin/vendors/:id
async function getVendorById(vendorId) {
  const params = {
    TableName: TABLE_NAME,
    Key: { PK: `VENDOR#${vendorId}`, SK: `VENDOR#${vendorId}` },
  };

  const result = await dynamodb.get(params).promise();
  if (!result.Item) {
    return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Vendor not found' }) };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result.Item),
  };
}

// GET /admin/vendors/:id/orders
async function getVendorOrders(vendorId, event) {
  // Query orders by vendor (assuming orders have vendorId field)
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType AND vendorId = :vendorId',
    ExpressionAttributeValues: {
      ':entityType': 'ORDER',
      ':vendorId': vendorId,
    },
  };

  const result = await dynamodb.scan(params).promise();

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      orders: result.Items || [],
      count: result.Count || 0,
    }),
  };
}

// POST /admin/vendors/:id/notify
async function notifyVendor(event) {
  // In production, send email via SES
  console.log('📧 Vendor notification:', event.body);
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Notification sent' }),
  };
}

// PATCH /admin/orders/:orderId/status
async function updateOrderStatus(event) {
  const body = JSON.parse(event.body);
  const { orderId, status, inventoryAction, timelineEvent } = body;

  // Find the order
  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType AND orderId = :orderId',
    ExpressionAttributeValues: { ':entityType': 'ORDER', ':orderId': orderId },
  };

  const result = await dynamodb.scan(scanParams).promise();
  if (!result.Items || result.Items.length === 0) {
    return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Order not found' }) };
  }

  const order = result.Items[0];
  order.status = status;
  order.updatedAt = new Date().toISOString();

  // Add timeline event
  if (!order.timeline) order.timeline = [];
  if (timelineEvent) order.timeline.push(timelineEvent);

  // Handle inventory
  if (inventoryAction === 'reserve') order.inventoryReserved = true;
  if (inventoryAction === 'deduct') order.inventoryDeducted = true;
  if (inventoryAction === 'release') order.inventoryReserved = false;

  await dynamodb.put({ TableName: TABLE_NAME, Item: order }).promise();

  // Update product stock if needed
  if (inventoryAction === 'deduct' || inventoryAction === 'release') {
    for (const item of order.items || []) {
      await updateProductStock(item.productId, inventoryAction === 'deduct' ? -1 : 1);
    }
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'Order status updated', order }),
  };
}

// Update product stock
async function updateProductStock(productId, quantityChange) {
  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType AND id = :id',
    ExpressionAttributeValues: { ':entityType': 'PRODUCT', ':id': productId },
  };

  const result = await dynamodb.scan(scanParams).promise();
  if (result.Items && result.Items.length > 0) {
    const product = result.Items[0];
    product.stock = Math.max(0, (product.stock || 0) + quantityChange);
    await dynamodb.put({ TableName: TABLE_NAME, Item: product }).promise();
  }
}

// GET /admin/inventory/low-stock
async function getLowStockAlerts(event) {
  const threshold = parseInt(event.queryStringParameters?.threshold || '10');

  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :entityType AND stock <= :threshold AND stock > :zero',
    ExpressionAttributeValues: {
      ':entityType': 'PRODUCT',
      ':threshold': threshold,
      ':zero': 0,
    },
  };

  const result = await dynamodb.scan(scanParams).promise();

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      products: result.Items || [],
      count: result.Count || 0,
      threshold,
    }),
  };
}
