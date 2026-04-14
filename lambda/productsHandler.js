const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'fashionstore-data';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const params = event.queryStringParameters || {};
        const category = params.category;
        const brand = params.brand;
        const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
        const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
        const sortBy = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder || 'desc';
        const limit = parseInt(params.limit || '50');
        const page = parseInt(params.page || '1');

        // Scan ALL products (up to 20,000 for accuracy)
        let allProducts = [];
        let lastKey = null;
        const MAX_SCAN = 20000;
        let scannedCount = 0;

        do {
            const scanParams = {
                TableName: TABLE_NAME,
                FilterExpression: 'entityType = :entityType',
                ExpressionAttributeValues: { ':entityType': 'PRODUCT' },
                Limit: 1000,
                ExclusiveStartKey: lastKey || undefined
            };

            const result = await dynamodb.scan(scanParams).promise();
            scannedCount += result.Count || 0;
            allProducts = allProducts.concat(result.Items || []);
            lastKey = result.LastEvaluatedKey;

            if (scannedCount >= MAX_SCAN) break;
        } while (lastKey);

        let filtered = allProducts;

        // Apply category filter
        if (category && category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        // Apply brand filter
        if (brand && brand !== 'all') {
            const brandLower = brand.toLowerCase().trim();
            filtered = filtered.filter(p => p.brand && p.brand.toLowerCase().trim() === brandLower);
        }

        // Apply price range filter
        if (minPrice !== null) {
            filtered = filtered.filter(p => (p.price || 0) >= minPrice);
        }
        if (maxPrice !== null) {
            filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'price') {
                valA = a.price || 0;
                valB = b.price || 0;
            } else if (sortBy === 'name') {
                valA = (a.name || '').toLowerCase();
                valB = (b.name || '').toLowerCase();
            } else if (sortBy === 'createdAt') {
                valA = new Date(a.createdAt || 0).getTime();
                valB = new Date(b.createdAt || 0).getTime();
            } else {
                valA = a[sortBy] || '';
                valB = b[sortBy] || '';
            }

            if (sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        // Apply pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                items: paginated,
                count: paginated.length,
                total: filtered.length,
                page,
                limit,
                filters: { category, brand, minPrice, maxPrice, sortBy, sortOrder }
            })
        };
    } catch (error) {
        console.error('❌ Lambda Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
