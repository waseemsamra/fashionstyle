import json
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb').Table('products-prod')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        path = event.get('path', '')
        product_id = event.get('pathParameters', {}).get('id')
        method = event.get('httpMethod')
        
        if method == 'PUT' and product_id:
            body = json.loads(event.get('body', '{}'))
            
            update_expression = ['updatedAt = :updatedAt']
            expression_values = {':updatedAt': datetime.utcnow().isoformat()}
            
            if 'isFeatured' in body:
                update_expression.append('isFeatured = :isFeatured')
                expression_values[':isFeatured'] = body['isFeatured']
            if 'isWeddingTales' in body:
                update_expression.append('isWeddingTales = :isWeddingTales')
                expression_values[':isWeddingTales'] = body['isWeddingTales']
            if 'isDesignersDiscount' in body:
                update_expression.append('isDesignersDiscount = :isDesignersDiscount')
                expression_values[':isDesignersDiscount'] = body['isDesignersDiscount']
            
            response = dynamodb.update_item(
                Key={'id': product_id},
                UpdateExpression='SET ' + ', '.join(update_expression),
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW'
            )
            
            product = response.get('Attributes', {})
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Product updated successfully',
                    'product': product
                }, default=decimal_default)
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }