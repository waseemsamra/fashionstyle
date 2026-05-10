import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('fashionstore-prod-catalog')  # Your actual table name

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
}

def decimal_to_num(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def scan_all(filter_expr=None, expr_attrs=None):
    """Scan entire DynamoDB table handling pagination (1MB limit per scan)"""
    kwargs = {}
    if filter_expr:
        kwargs['FilterExpression'] = filter_expr
    if expr_attrs:
        kwargs['ExpressionAttributeValues'] = expr_attrs

    items = []
    while True:
        response = table.scan(**kwargs)
        items.extend(response.get('Items', []))
        last_key = response.get('LastEvaluatedKey')
        if not last_key:
            break
        kwargs['ExclusiveStartKey'] = last_key
    return items

def lambda_handler(event, context):
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS' or \
       event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    path = event.get('rawPath') or event.get('path', '/')

    try:
        # ── /products ──────────────────────────────────────────────
        if '/products' in path and not path.split('/products')[-1].strip('/'):
            limit  = min(int(params.get('limit', 50)), 500)
            offset = int(params.get('offset', 0))
            category  = params.get('category')
            brands    = [b.strip() for b in params.get('brands', '').split(',') if b.strip()]
            brand     = params.get('brand')
            min_price = params.get('minPrice')
            max_price = params.get('maxPrice')
            is_new    = params.get('isNew', '').lower() == 'true'
            is_sale   = params.get('isSale', '').lower() == 'true'
            sort_by   = params.get('sortBy', 'createdAt')
            sort_order = params.get('sortOrder', 'desc')
            search    = params.get('search', '').lower()

            all_items = scan_all()

            # Apply filters
            filtered = []
            for item in all_items:
                if category and item.get('category') != category:
                    continue
                if brand and item.get('brand') != brand:
                    continue
                if brands and item.get('brand') not in brands:
                    continue
                price = float(item.get('price', item.get('basePrice', 0)) or 0)
                if min_price and price < float(min_price):
                    continue
                if max_price and price > float(max_price):
                    continue
                if is_new and not item.get('isNew'):
                    continue
                if is_sale and not item.get('isSale'):
                    continue
                if search and search not in item.get('name', '').lower() and \
                   search not in item.get('description', '').lower():
                    continue
                # Normalize fields
                item['price'] = price
                item['id'] = item.get('id') or item.get('PK', '').replace('PROD#', '').replace('product-', '')
                filtered.append(item)

            # Sort
            if sort_by == 'price':
                filtered.sort(key=lambda x: x.get('price', 0), reverse=(sort_order == 'desc'))
            elif sort_by == 'name':
                filtered.sort(key=lambda x: x.get('name', ''), reverse=(sort_order == 'desc'))

            total = len(filtered)
            paginated = filtered[offset:offset + limit]

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'items': paginated,
                    'total': total,
                    'offset': offset,
                    'limit': limit,
                    'hasMore': (offset + limit) < total
                }, default=decimal_to_num)
            }

        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
