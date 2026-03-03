const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userId = event.pathParameters?.userId;
    const method = event.httpMethod;

    if (method === 'GET') {
      const result = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' }
      }).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ profile: result.Item?.profile || {} })
      };
    }

    if (method === 'PUT') {
      const profile = JSON.parse(event.body);
      
      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          profile,
          updatedAt: new Date().toISOString()
        }
      }).promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Profile updated', profile })
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
