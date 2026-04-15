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
        const brandsParam = params.brands; // Comma separated string
        const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
        const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
        const sortBy = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder || 'desc';
        const limit = parseInt(params.limit || '50');
        const page = parseInt(params.page || '1');

        console.log(`🔍 Filters: Category=${category}, Brands=${brandsParam}, Price=${minPrice}-${maxPrice}, Sort=${sortBy} ${sortOrder}`);

        // 1. Scan ALL products (up to 20,000 to ensure we find everything for categories)
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

        console.log(`📦 Scanned ${scannedCount} items, found ${allProducts.length} products before filtering`);

        let filtered = allProducts;

        // 2. Apply Category Filter (Case-insensitive and trim whitespace)
        if (category && category !== 'all') {
            const normalizedCategory = category.trim().toLowerCase();
            console.log(`🏷️ Normalizing category filter: "${category}" -> "${normalizedCategory}"`);
            
            const beforeFilter = filtered.length;
            filtered = filtered.filter(p => {
                const productCategory = p.category ? p.category.trim().toLowerCase() : '';
                return productCategory === normalizedCategory;
            });
            console.log(`🏷️ After category filter: ${beforeFilter} -> ${filtered.length} products matched`);
        }

        // 3. Apply Brand Filter (Supports comma-separated list for multi-select)
        if (brandsParam) {
            const selectedBrands = brandsParam.split(',').map(b => b.toLowerCase().trim());
            filtered = filtered.filter(p => {
                const pBrand = p.brand ? p.brand.toLowerCase().trim() : '';
                return selectedBrands.some(sb => pBrand === sb || pBrand.includes(sb));
            });
        }

        // 4. Apply Price Range Filter
        if (minPrice !== null) {
            filtered = filtered.filter(p => (p.price || 0) >= minPrice);
        }
        if (maxPrice !== null) {
            filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
        }

        console.log(`✅ After filtering: ${filtered.length} products`);

        // 5. Apply Sorting
        filtered.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'price') {
                valA = a.price || 0;
                valB = b.price || 0;
            } else if (sortBy === 'name') {
                valA = (a.name || '').toLowerCase();
                valB = (b.name || '').toLowerCase();
            } else {
                // Default: Date
                valA = new Date(a.createdAt || 0).getTime();
                valB = new Date(b.createdAt || 0).getTime();
            }

            if (sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        // 6. Apply Pagination
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);

        console.log(`📄 Returning page ${page} (${paginated.length} items) of ${filtered.length} total`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                items: paginated,
                count: paginated.length,
                total: filtered.length,
                page,
                limit
            })
        };
    } catch (error) {
        console.error('❌ Lambda Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
