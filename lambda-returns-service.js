const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { randomBytes } = require('crypto');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.RETURNS_TABLE || 'fashionstore-returns-prod';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'fashionstore-orders-prod';

// Return reasons catalog
const RETURN_REASONS = {
  SIZE_TOO_SMALL: 'Size too small',
  SIZE_TOO_LARGE: 'Size too large',
  NOT_AS_DESCRIBED: 'Not as described',
  DEFECTIVE: 'Defective item',
  DAMAGED: 'Damaged during shipping',
  WRONG_ITEM: 'Wrong item received',
  STYLE_NOT_SUITABLE: 'Style not suitable',
  COLOR_DIFFERENT: 'Color different from picture',
  NO_LONGER_NEEDED: 'No longer needed',
  BETTER_PRICE_ELSEWHERE: 'Found better price elsewhere',
  OTHER: 'Other'
};

// Return statuses
const RETURN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  AWAITING_RETURN: 'awaiting_return',
  ITEM_RECEIVED: 'item_received',
  QUALITY_CHECK: 'quality_check',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
  EXCHANGE_INITIATED: 'exchange_initiated',
  EXCHANGE_SHIPPED: 'exchange_shipped',
  EXCHANGE_DELIVERED: 'exchange_delivered',
  CLOSED: 'closed'
};

// Refund methods
const REFUND_METHODS = {
  ORIGINAL_PAYMENT: 'original_payment',
  STORE_CREDIT: 'store_credit',
  GIFT_CARD: 'gift_card',
  BANK_TRANSFER: 'bank_transfer'
};

exports.handler = async (event) => {
  console.log('🔄 RETURNS SERVICE INVOKED');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': event.headers?.origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: 'No authorization token provided' })
    };
  }
  
  const path = event.path;
  const method = event.httpMethod;
  let body = {};
  
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON body' })
    };
  }
  
  try {
    // Route handling
    if (path === '/admin/returns') {
      return await handleReturns(method, body, headers);
    } else if (path.match(/^\/admin\/returns\/[^\/]+$/)) {
      const returnId = path.split('/').pop();
      return await handleReturnById(method, returnId, body, headers);
    } else if (path === '/admin/returns/request') {
      return await requestReturn(body, headers);
    } else if (path === '/admin/returns/calculate') {
      return await calculateReturn(body, headers);
    } else if (path === '/admin/returns/label') {
      return await generateReturnLabel(body, headers);
    } else if (path === '/admin/returns/process-refund') {
      return await processRefund(body, headers);
    } else if (path === '/admin/returns/exchange') {
      return await processExchange(body, headers);
    } else if (path === '/admin/returns/stats') {
      return await getReturnStats(body, headers);
    } else if (path === '/admin/returns/reasons') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(RETURN_REASONS)
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Route not found' })
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

async function handleReturns(method, body, headers) {
  switch (method) {
    case 'GET':
      return await getAllReturns(body, headers);
    case 'POST':
      return await createReturn(body, headers);
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
  }
}

async function handleReturnById(method, returnId, body, headers) {
  switch (method) {
    case 'GET':
      return await getReturnById(returnId, headers);
    case 'PUT':
      return await updateReturn(returnId, body, headers);
    case 'DELETE':
      return await deleteReturn(returnId, headers);
    default:
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
  }
}

async function getAllReturns(data, headers) {
  const { customerId, status, limit = 50, lastKey } = data;
  
  let params = {
    TableName: TABLE_NAME,
    Limit: limit
  };
  
  if (customerId) {
    params = {
      TableName: TABLE_NAME,
      IndexName: 'CustomerIndex',
      KeyConditionExpression: 'customerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': customerId
      },
      Limit: limit
    };
    
    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }
  } else if (status) {
    params = {
      TableName: TABLE_NAME,
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames = { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status
      },
      Limit: limit
    };
  }
  
  if (lastKey) {
    params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
  }
  
  const result = await docClient.send(new QueryCommand(params));
  
  const nextKey = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null;
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      items: result.Items,
      nextKey,
      count: result.Count
    })
  };
}

async function getReturnById(returnId, headers) {
  const params = {
    TableName: TABLE_NAME,
    Key: { returnId }
  };
  
  const result = await docClient.send(new GetCommand(params));
  
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Return not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Item)
  };
}

async function createReturn(data, headers) {
  const { orderId, customerId, items, reason, comments, images } = data;
  
  const order = await getOrder(orderId);
  if (!order) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Order not found' })
    };
  }
  
  const daysSinceDelivery = calculateDaysSince(order.deliveredAt);
  if (daysSinceDelivery > 30) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Order is outside return window (30 days)' })
    };
  }
  
  const returnId = `RET-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  
  const returnRequest = {
    returnId,
    orderId,
    customerId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    items,
    reason,
    comments,
    images: images || [],
    status: RETURN_STATUS.PENDING,
    requestDate: new Date().toISOString(),
    returnWindow: calculateReturnWindow(order.deliveredAt),
    estimatedRefund: calculateEstimatedRefund(items, order),
    shippingCost: order.shippingCost || 0,
    totalRefund: 0,
    timeline: [{
      status: RETURN_STATUS.PENDING,
      timestamp: new Date().toISOString(),
      note: 'Return request submitted'
    }]
  };
  
  const params = {
    TableName: TABLE_NAME,
    Item: returnRequest
  };
  
  await docClient.send(new PutCommand(params));
  
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(returnRequest)
  };
}

async function updateReturn(returnId, data, headers) {
  const { status, adminNotes, refundAmount, refundMethod, trackingNumber, carrier, note } = data;
  
  const existing = await getReturnById(returnId, headers);
  if (existing.statusCode !== 200) {
    return existing;
  }
  
  const returnData = JSON.parse(existing.body);
  
  let updateExpression = 'SET updatedAt = :updatedAt';
  let expressionAttributeValues = {
    ':updatedAt': new Date().toISOString()
  };
  let expressionAttributeNames = {};
  
  if (status) {
    updateExpression += ', #status = :status';
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = status;
    
    const timeline = returnData.timeline || [];
    timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`
    });
    updateExpression += ', timeline = :timeline';
    expressionAttributeValues[':timeline'] = timeline;
  }
  
  if (adminNotes !== undefined) {
    updateExpression += ', adminNotes = :adminNotes';
    expressionAttributeValues[':adminNotes'] = adminNotes;
  }
  
  if (refundAmount !== undefined) {
    updateExpression += ', refundAmount = :refundAmount';
    expressionAttributeValues[':refundAmount'] = refundAmount;
  }
  
  if (refundMethod) {
    updateExpression += ', refundMethod = :refundMethod';
    expressionAttributeValues[':refundMethod'] = refundMethod;
  }
  
  if (trackingNumber) {
    updateExpression += ', returnTrackingNumber = :trackingNumber';
    expressionAttributeValues[':trackingNumber'] = trackingNumber;
  }
  
  if (carrier) {
    updateExpression += ', returnCarrier = :carrier';
    expressionAttributeValues[':carrier'] = carrier;
  }
  
  const params = {
    TableName: TABLE_NAME,
    Key: { returnId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...(Object.keys(expressionAttributeNames).length > 0 && {
      ExpressionAttributeNames: expressionAttributeNames
    }),
    ReturnValues: 'ALL_NEW'
  };
  
  const result = await docClient.send(new UpdateCommand(params));
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Attributes)
  };
}

async function deleteReturn(returnId, headers) {
  const params = {
    TableName: TABLE_NAME,
    Key: { returnId }
  };
  
  await docClient.send(new DeleteCommand(params));
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Return deleted successfully' })
  };
}

async function requestReturn(data, headers) {
  const { orderId, customerId, items, reason, comments } = data;
  
  const order = await getOrder(orderId);
  if (!order || order.customerId !== customerId) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }
  
  return await createReturn(data, headers);
}

async function calculateReturn(data, headers) {
  const { items, orderId } = data;
  
  const order = await getOrder(orderId);
  if (!order) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Order not found' })
    };
  }
  
  const calculation = {
    items: [],
    subtotal: 0,
    shipping: order.shippingCost || 0,
    restockingFee: 0,
    totalRefund: 0
  };
  
  for (const item of items) {
    const orderItem = order.items.find(i => i.id === item.id);
    if (!orderItem) continue;
    
    const itemRefund = {
      id: item.id,
      name: orderItem.name,
      quantity: item.quantity,
      price: orderItem.price,
      refundAmount: orderItem.price * item.quantity
    };
    
    calculation.items.push(itemRefund);
    calculation.subtotal += itemRefund.refundAmount;
  }
  
  const daysSinceDelivery = calculateDaysSince(order.deliveredAt);
  if (daysSinceDelivery <= 7) {
    calculation.restockingFee = 0;
  } else if (daysSinceDelivery <= 30) {
    calculation.restockingFee = calculation.subtotal * 0.15;
  }
  
  calculation.totalRefund = calculation.subtotal - calculation.restockingFee;
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(calculation)
  };
}

async function generateReturnLabel(data, headers) {
  const { returnId, carrier = 'USPS' } = data;
  
  const returnData = await getReturnById(returnId, headers);
  if (returnData.statusCode !== 200) {
    return returnData;
  }
  
  const trackingNumber = generateTrackingNumber(carrier);
  const labelUrl = `https://fashionstore-returns.s3.amazonaws.com/labels/${returnId}.pdf`;
  
  await updateReturn(returnId, {
    status: RETURN_STATUS.AWAITING_RETURN,
    returnTrackingNumber: trackingNumber,
    returnCarrier: carrier,
    note: `Return label generated via ${carrier}`
  }, headers);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      returnId,
      trackingNumber,
      carrier,
      labelUrl,
      instructions: 'Print this label and attach to your package. Drop off at any carrier location.'
    })
  };
}

async function processRefund(data, headers) {
  const { returnId, refundMethod = REFUND_METHODS.ORIGINAL_PAYMENT, amount, notes } = data;
  
  const returnData = await getReturnById(returnId, headers);
  if (returnData.statusCode !== 200) {
    return returnData;
  }
  
  const returnInfo = JSON.parse(returnData.body);
  
  const refundTransaction = {
    transactionId: `REF-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`,
    amount: amount || returnInfo.estimatedRefund,
    method: refundMethod,
    timestamp: new Date().toISOString(),
    status: 'completed',
    notes
  };
  
  await updateReturn(returnId, {
    status: RETURN_STATUS.REFUNDED,
    refundAmount: refundTransaction.amount,
    refundMethod,
    refundTransaction,
    note: `Refund processed: $${refundTransaction.amount} via ${refundMethod}`
  }, headers);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Refund processed successfully',
      transaction: refundTransaction
    })
  };
}

async function processExchange(data, headers) {
  const { returnId, exchangeItems } = data;
  
  const returnData = await getReturnById(returnId, headers);
  if (returnData.statusCode !== 200) {
    return returnData;
  }
  
  const returnInfo = JSON.parse(returnData.body);
  
  const originalTotal = returnInfo.estimatedRefund;
  const exchangeTotal = exchangeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const priceDifference = exchangeTotal - originalTotal;
  
  const exchange = {
    exchangeId: `EXC-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`,
    items: exchangeItems,
    originalTotal,
    exchangeTotal,
    priceDifference,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  await updateReturn(returnId, {
    status: RETURN_STATUS.EXCHANGE_INITIATED,
    exchange,
    note: `Exchange initiated. ${priceDifference > 0 ? `Additional payment required: $${priceDifference}` : `Refund difference: $${-priceDifference}`}`
  }, headers);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Exchange initiated',
      exchange,
      paymentRequired: priceDifference > 0 ? priceDifference : 0,
      refundAmount: priceDifference < 0 ? -priceDifference : 0
    })
  };
}

async function getReturnStats(data, headers) {
  const { period = 'month' } = data;
  
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'requestDate >= :startDate',
    ExpressionAttributeValues: {
      ':startDate': startDate.toISOString()
    }
  };
  
  const result = await docClient.send(new ScanCommand(params));
  
  const stats = {
    total: result.Count,
    pending: 0,
    approved: 0,
    rejected: 0,
    refunded: 0,
    exchanged: 0,
    totalRefundAmount: 0,
    byReason: {},
    byStatus: {},
    daily: {}
  };
  
  result.Items.forEach(item => {
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    
    if (item.status === RETURN_STATUS.PENDING) stats.pending++;
    if (item.status === RETURN_STATUS.APPROVED) stats.approved++;
    if (item.status === RETURN_STATUS.REJECTED) stats.rejected++;
    if (item.status === RETURN_STATUS.REFUNDED) {
      stats.refunded++;
      stats.totalRefundAmount += item.refundAmount || 0;
    }
    if (item.exchange) stats.exchanged++;
    
    if (item.reason) {
      stats.byReason[item.reason] = (stats.byReason[item.reason] || 0) + 1;
    }
    
    const day = item.requestDate.split('T')[0];
    stats.daily[day] = (stats.daily[day] || 0) + 1;
  });
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(stats)
  };
}

// Helper functions
async function getOrder(orderId) {
  const params = {
    TableName: ORDERS_TABLE,
    Key: { orderId }
  };
  
  const result = await docClient.send(new GetCommand(params));
  return result.Item;
}

function calculateDaysSince(dateString) {
  if (!dateString) return 0;
  const delivered = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - delivered);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateReturnWindow(deliveredAt) {
  const days = calculateDaysSince(deliveredAt);
  return {
    eligible: days <= 30,
    daysRemaining: Math.max(0, 30 - days),
    deadline: new Date(new Date(deliveredAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

function calculateEstimatedRefund(items, order) {
  let total = 0;
  for (const item of items) {
    const orderItem = order.items.find(i => i.id === item.id);
    if (orderItem) {
      total += orderItem.price * item.quantity;
    }
  }
  return total;
}

function generateTrackingNumber(carrier) {
  const prefixes = {
    'USPS': '94',
    'UPS': '1Z',
    'FedEx': '78',
    'DHL': '00'
  };
  
  const prefix = prefixes[carrier] || '99';
  const random = Math.random().toString(36).substring(2, 15).toUpperCase();
  const timestamp = Date.now().toString().slice(-8);
  
  return `${prefix}${random}${timestamp}`;
}
