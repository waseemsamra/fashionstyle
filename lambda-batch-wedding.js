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
    const { weddingIds } = body;

    if (!Array.isArray(weddingIds)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'weddingIds must be an array' })
      };
    }

    console.log('📝 Updating Wedding Tales products:', weddingIds);

    // Get all products
    const scanResult = await dynamodb.scan({
      TableName: PRODUCTS_TABLE
    }).promise();

    const products = scanResult.Items;
    const updatePromises = [];

    // Update each product's isWeddingTales flag
    for (const product of products) {
      const isWeddingTales = weddingIds.includes(product.id);
      
      // Only update if status changed
      if (product.isWeddingTales !== isWeddingTales) {
        updatePromises.push(
          dynamodb.update({
            TableName: PRODUCTS_TABLE,
            Key: {
              id: product.id,
              PK: `PRODUCT#${product.id}`
            },
            UpdateExpression: 'SET isWeddingTales = :val, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':val': isWeddingTales,
              ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'NONE'
          }).promise()
        );
      }
    }

    await Promise.all(updatePromises);

    console.log('✅ Updated', updatePromises.length, 'Wedding Tales products');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Wedding Tales products updated successfully',
        weddingIds: weddingIds.length,
        updated: updatePromises.length
      })
    };

  } catch (error) {
    console.error('❌ Error updating Wedding Tales:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update Wedding Tales products',
        message: error.message
      })
    };
  }
};
