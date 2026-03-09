const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const method = event.httpMethod;

    // GET /users - List all users
    if (method === 'GET') {
      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'begins_with(PK, :pkPrefix)',
        ExpressionAttributeValues: {
          ':pkPrefix': 'USER#'
        },
        ScanIndexForward: true
      };

      const result = await dynamodb.query(params).promise();

      // Extract user profiles from the items
      const users = result.Items
        .filter(item => item.SK === 'PROFILE' && item.profile)
        .map(item => ({
          userId: item.PK.replace('USER#', ''),
          email: item.profile?.email || '',
          firstName: item.profile?.firstName || '',
          lastName: item.profile?.lastName || '',
          contact: item.profile?.contact || '',
          createdAt: item.createdAt || item.updatedAt || new Date().toISOString()
        }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users, total: users.length })
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
