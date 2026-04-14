const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': process.env.CORS_ALLOW_METHODS || 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const tableName = process.env.TABLE_NAME;
        const category = event.queryStringParameters?.category;
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const page = parseInt(event.queryStringParameters?.page || '1');

        if (category) {
            // Scan ALL items first (up to 20,000)
            let allItems = [];
            let lastKey = null;
            
            do {
                const params = {
                    TableName: tableName,
                    Limit: 20000,
                    ExclusiveStartKey: lastKey
                };
                
                const result = await dynamodb.scan(params).promise();
                allItems = allItems.concat(result.Items);
                lastKey = result.LastEvaluatedKey;
            } while (lastKey);
            
            // Filter by category
            const filteredItems = allItems.filter(item => item.category === category);
            
            // Apply pagination
            const start = (page - 1) * limit;
            const end = start + limit;
            const paginatedItems = filteredItems.slice(start, end);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    items: paginatedItems,
                    count: paginatedItems.length,
                    total: filteredItems.length,
                    category_filter: category,
                    page: page,
                    limit: limit
                })
            };
        } else {
            const params = {
                TableName: tableName,
                Limit: limit,
                ExclusiveStartKey: page > 1 ? { id: event.queryStringParameters?.lastKey } : undefined
            };
            
            const result = await dynamodb.scan(params).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    items: result.Items,
                    count: result.Items.length,
                    total: result.Count,
                    lastKey: result.LastEvaluatedKey
                })
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
