const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME || 'fashionstore-products-prod';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const productId = event.pathParameters?.id;
    const method = event.httpMethod;

    if (!productId) {
      // GET /products - List all products
      const result = await dynamodb.scan({
        TableName: TABLE_NAME
      }).promise();

      const items = result.Items;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ items, total: items.length })
      };
    }

    if (method === 'PUT') {
      // PUT /products/{id} - Update product
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
        TableName: TABLE_NAME,
        Key: { id: productId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
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

    if (method === 'DELETE') {
      // DELETE /products/{id} - Delete product
      await dynamodb.delete({
        TableName: TABLE_NAME,
        Key: { id: productId }
      }).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Product deleted successfully' })
      };
    }

    // GET /products/{id} - Get single product
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { id: productId }
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Product not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
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