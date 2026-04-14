const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Use TABLE_NAME env var with fallback
const TABLE_NAME = process.env.TABLE_NAME || 'fashionstore-data';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': process.env.CORS_ALLOW_METHODS || 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const category = event.queryStringParameters?.category;
        const brand = event.queryStringParameters?.brand;
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const page = parseInt(event.queryStringParameters?.page || '1');

        console.log(`🔍 Request - Category: ${category || 'none'}, Brand: ${brand || 'none'}, Limit: ${limit}, Page: ${page}`);

        // Scan ALL products - need to scan everything to get accurate category counts
        let allProducts = [];
        let lastKey = null;
        let scanCount = 0;

        // When filtering by category, scan more items to ensure we find all matches
        const MAX_SCAN_ITEMS = category ? 20000 : 5000;

        do {
            const params = {
                TableName: TABLE_NAME,
                FilterExpression: 'entityType = :entityType',
                ExpressionAttributeValues: { ':entityType': 'PRODUCT' },
                Limit: 1000, // Scan in batches of 1000
                ExclusiveStartKey: lastKey || undefined
            };

            const result = await dynamodb.scan(params).promise();
            scanCount += result.Count || 0;
            allProducts = allProducts.concat(result.Items || []);
            lastKey = result.LastEvaluatedKey;

            console.log(`📊 Scan batch: ${result.Items?.length || 0} items, total scanned: ${scanCount}`);

            // Stop if we've scanned enough
            if (scanCount >= MAX_SCAN_ITEMS) {
                console.log(`⚠️ Reached scan limit of ${MAX_SCAN_ITEMS}`);
                break;
            }
        } while (lastKey);

        console.log(`📦 Scanned ${scanCount} items, found ${allProducts.length} products before filtering`);

        // Apply category filter
        let filtered = allProducts;
        if (category && category !== 'all') {
            filtered = allProducts.filter(p => p.category === category);
            console.log(`📂 After category filter: ${filtered.length} products`);
        }

        // Apply brand filter
        if (brand && brand !== 'all') {
            const brandLower = brand.toLowerCase().trim();
            filtered = filtered.filter(p =>
                p.brand && p.brand.toLowerCase().trim() === brandLower
            );
            console.log(`🏷️ After brand filter: ${filtered.length} products`);
        }

        // Apply pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);

        console.log(`✅ Returning ${paginated.length} products (page ${page}, total: ${filtered.length})`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                items: paginated,
                count: paginated.length,
                total: filtered.length,
                page: page,
                limit: limit
            })
        };
    } catch (error) {
        console.error('❌ Lambda Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
