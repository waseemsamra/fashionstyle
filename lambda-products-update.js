const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'fashionstore-products-prod';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const productId = event.pathParameters?.id;
    const method = event.httpMethod;

    if (!productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Product ID required' })
      };
    }

    // PUT /products/{id} - Update product
    if (method === 'PUT') {
      const body = JSON.parse(event.body);
      
      const updateExpression = [];
      const expressionAttributeValues = {};
      
      if (body.name !== undefined) { 
        updateExpression.push('name = :name'); 
        expressionAttributeValues[':name'] = body.name; 
      }
      if (body.price !== undefined) { 
        updateExpression.push('price = :price'); 
        expressionAttributeValues[':price'] = body.price; 
      }
      if (body.category !== undefined) { 
        updateExpression.push('category = :category'); 
        expressionAttributeValues[':category'] = body.category; 
      }
      if (body.brand !== undefined) { 
        updateExpression.push('brand = :brand'); 
        expressionAttributeValues[':brand'] = body.brand; 
      }
      if (body.isFeatured !== undefined) { 
        updateExpression.push('isFeatured = :isFeatured'); 
        expressionAttributeValues[':isFeatured'] = body.isFeatured; 
      }
      if (body.isWeddingTales !== undefined) { 
        updateExpression.push('isWeddingTales = :isWeddingTales'); 
        expressionAttributeValues[':isWeddingTales'] = body.isWeddingTales; 
      }
      if (body.isDesignersDiscount !== undefined) { 
        updateExpression.push('isDesignersDiscount = :isDesignersDiscount'); 
        expressionAttributeValues[':isDesignersDiscount'] = body.isDesignersDiscount; 
      }
      
      updateExpression.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      
      const result = await dynamodb.update({
        TableName: PRODUCTS_TABLE,
        Key: { id: productId, PK: `PRODUCT#${productId}` },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Product updated successfully',
          product: result.Attributes
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};