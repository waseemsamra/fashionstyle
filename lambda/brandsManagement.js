const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const BRANDS_TABLE = process.env.BRANDS_TABLE || 'fashionstore-brands';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle CORS preflight
async function handleOptions() {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
}

// GET /admin/brands - List all brands
async function getAllBrands(event) {
  console.log('Getting all brands...');
  
  try {
    const params = {
      TableName: BRANDS_TABLE,
    };

    const result = await dynamodb.scan(params).promise();
    console.log('Brands found:', result.Items.length);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        brands: result.Items || [],
        count: result.Items.length,
      }),
    };
  } catch (error) {
    console.error('Error getting brands:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to fetch brands',
        message: error.message 
      }),
    };
  }
}

// POST /admin/brands - Create new brand
async function createBrand(event) {
  console.log('Creating brand...');
  
  try {
    const body = JSON.parse(event.body);
    const { name, description, logo, active } = body;

    if (!name) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Brand name is required' }),
      };
    }

    const brand = {
      id: `brand-${Date.now()}`,
      name,
      description: description || '',
      logo: logo || '',
      active: active !== false,
      products: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.put({
      TableName: BRANDS_TABLE,
      Item: brand,
    }).promise();

    console.log('Brand created:', brand.id);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Brand created successfully',
        brand,
      }),
    };
  } catch (error) {
    console.error('Error creating brand:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to create brand',
        message: error.message 
      }),
    };
  }
}

// PUT /admin/brands/:id - Update brand
async function updateBrand(event, brandId) {
  console.log('Updating brand:', brandId);
  console.log('Event path:', event.path);
  console.log('Path parameters:', event.pathParameters);
  
  try {
    // Get brandId from path parameters if not passed
    if (!brandId && event.pathParameters && event.pathParameters.id) {
      brandId = event.pathParameters.id;
      console.log('Got brandId from pathParameters:', brandId);
    }
    
    if (!brandId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Brand ID is required' }),
      };
    }
    
    const body = JSON.parse(event.body);

    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (body.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeValues[':name'] = body.name;
      expressionAttributeNames['#name'] = 'name';
    }

    if (body.description !== undefined) {
      updateExpression.push('description = :description');
      expressionAttributeValues[':description'] = body.description;
    }

    if (body.logo !== undefined) {
      updateExpression.push('logo = :logo');
      expressionAttributeValues[':logo'] = body.logo;
    }

    if (body.active !== undefined) {
      updateExpression.push('active = :active');
      expressionAttributeValues[':active'] = body.active;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpression.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No fields to update' }),
      };
    }

    const updateParams = {
      TableName: BRANDS_TABLE,
      Key: { id: brandId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
    
    // Only add ExpressionAttributeNames if it has values
    if (Object.keys(expressionAttributeNames).length > 0) {
      updateParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await dynamodb.update(updateParams).promise();

    console.log('Brand updated:', brandId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Brand updated successfully',
        brand: result.Attributes,
      }),
    };
  } catch (error) {
    console.error('Error updating brand:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to update brand',
        message: error.message 
      }),
    };
  }
}

// DELETE /admin/brands/:id - Delete brand
async function deleteBrand(event, brandId) {
  console.log('Deleting brand:', brandId);
  console.log('Event path:', event.path);
  console.log('Path parameters:', event.pathParameters);
  
  try {
    // Get brandId from path parameters if not passed
    if (!brandId && event.pathParameters && event.pathParameters.id) {
      brandId = event.pathParameters.id;
      console.log('Got brandId from pathParameters:', brandId);
    }
    
    if (!brandId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Brand ID is required' }),
      };
    }
    
    await dynamodb.delete({
      TableName: BRANDS_TABLE,
      Key: { id: brandId },
    }).promise();

    console.log('Brand deleted:', brandId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Brand deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Error deleting brand:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to delete brand',
        message: error.message 
      }),
    };
  }
}

// Handler for API Gateway
exports.handler = async (event) => {
  console.log('Brands Handler:', event.path, event.httpMethod);

  const path = event.path;
  const method = event.httpMethod;

  // Handle CORS preflight FIRST
  if (method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return await handleOptions();
  }

  try {
    // Route: GET /admin/brands
    if (path === '/admin/brands' && method === 'GET') {
      return await getAllBrands(event);
    }

    // Route: POST /admin/brands
    if (path === '/admin/brands' && method === 'POST') {
      return await createBrand(event);
    }

    // Route: PUT /admin/brands/:id
    if (path.match(/^\/admin\/brands\/[^\/]+$/) && method === 'PUT') {
      const brandId = event.pathParameters ? event.pathParameters.id : path.split('/').pop();
      console.log('PUT request for brand:', brandId);
      return await updateBrand(event, brandId);
    }

    // Route: DELETE /admin/brands/:id
    if (path.match(/^\/admin\/brands\/[^\/]+$/) && method === 'DELETE') {
      const brandId = event.pathParameters ? event.pathParameters.id : path.split('/').pop();
      console.log('DELETE request for brand:', brandId);
      return await deleteBrand(event, brandId);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
