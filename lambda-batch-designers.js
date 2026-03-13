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
    const { designersDiscount } = body;

    if (!Array.isArray(designersDiscount)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'designersDiscount must be an array' })
      };
    }

    console.log('📝 Updating Designers Discount products:', designersDiscount);

    const scanResult = await dynamodb.scan({ TableName: PRODUCTS_TABLE }).promise();
    const products = scanResult.Items;
    const updatePromises = [];

    for (const product of products) {
      const isDesignersDiscount = designersDiscount.includes(product.id);
      
      if (product.isDesignersDiscount !== isDesignersDiscount) {
        updatePromises.push(
          dynamodb.update({
            TableName: PRODUCTS_TABLE,
            Key: { id: product.id, PK: `PRODUCT#${product.id}` },
            UpdateExpression: 'SET isDesignersDiscount = :val, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':val': isDesignersDiscount,
              ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'NONE'
          }).promise()
        );
      }
    }

    await Promise.all(updatePromises);

    console.log('✅ Updated', updatePromises.length, 'Designers Discount products');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Designers Discount products updated successfully',
        designersDiscount: designersDiscount.length,
        updated: updatePromises.length
      })
    };

  } catch (error) {
    console.error('❌ Error updating Designers Discount:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update Designers Discount products', message: error.message })
    };
  }
};
