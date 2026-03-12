const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'fashionstore-products-prod';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const { featuredIds } = body;

    if (!Array.isArray(featuredIds)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'featuredIds must be an array' })
      };
    }

    console.log('📝 Updating featured products:', featuredIds);

    // Get all products
    const scanResult = await dynamodb.scan({
      TableName: PRODUCTS_TABLE
    }).promise();

    const products = scanResult.Items;
    const updatePromises = [];

    // Update each product's isFeatured flag
    for (const product of products) {
      const isFeatured = featuredIds.includes(product.id);
      
      // Only update if status changed
      if (product.isFeatured !== isFeatured) {
        updatePromises.push(
          dynamodb.update({
            TableName: PRODUCTS_TABLE,
            Key: {
              id: product.id,
              PK: `PRODUCT#${product.id}`
            },
            UpdateExpression: 'SET isFeatured = :isFeatured, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':isFeatured': isFeatured,
              ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'NONE'
          }).promise()
        );
      }
    }

    await Promise.all(updatePromises);

    console.log('✅ Updated', updatePromises.length, 'products');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Featured products updated successfully',
        updated: updatePromises.length,
        featuredIds: featuredIds
      })
    };

  } catch (error) {
    console.error('❌ Error updating featured products:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update featured products',
        message: error.message
      })
    };
  }
};
