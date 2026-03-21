#!/usr/bin/env python3
import boto3
import time

api_id = 'jxh66jgwq8'
region = 'us-east-1'
brands_resource_id = 'xlmsc0'  # /admin/brands
brand_resource_id = 'm7yzfg'   # /admin/brands/{id}

client = boto3.client('apigateway', region_name=region)

print("🔧 Fixing CORS for Brands API...\n")

def fix_cors_for_resource(resource_id, path):
    print(f"📝 Fixing {path}...")
    
    # Delete existing OPTIONS
    try:
        client.delete_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS'
        )
        time.sleep(1)
    except:
        pass
    
    # Create OPTIONS method
    client.put_method(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        authorizationType='NONE',
        requestParameters={
            'method.request.header.Origin': False,
            'method.request.header.Access-Control-Request-Method': False,
            'method.request.header.Access-Control-Request-Headers': False,
        }
    )
    
    # Add MOCK integration
    client.put_integration(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        type='MOCK',
        integrationHttpMethod='GET',
        requestTemplates={'application/json': '{"statusCode": 200}'}
    )
    
    # Add method response
    client.put_method_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseParameters={
            'method.response.header.Access-Control-Allow-Origin': True,
            'method.response.header.Access-Control-Allow-Headers': True,
            'method.response.header.Access-Control-Allow-Methods': True,
        }
    )
    
    # Add integration response
    client.put_integration_response(
        restApiId=api_id,
        resourceId=resource_id,
        httpMethod='OPTIONS',
        statusCode='200',
        responseTemplates={'application/json': ''},
        responseParameters={
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
        }
    )
    
    print(f"✅ Fixed {path}")

# Fix both resources
fix_cors_for_resource(brands_resource_id, '/admin/brands')
fix_cors_for_resource(brand_resource_id, '/admin/brands/{id}')

# Deploy
print("\n📦 Deploying API...")
client.create_deployment(restApiId=api_id, stageName='prod')

print("⏳ Waiting 15 seconds for deployment...")
time.sleep(15)

# Test
print("\n🧪 Testing CORS...")
import requests
response = requests.options(
    f'https://{api_id}.execute-api.{region}.amazonaws.com/prod/admin/brands',
    headers={
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
    },
    timeout=10
)
print(f"Status: {response.status_code}")
cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
if cors_headers:
    print(f"✅ CORS Headers present: {cors_headers}")
else:
    print(f"❌ No CORS headers found")
    print(f"All headers: {dict(response.headers)}")

print("\n✅ Done! Hard refresh your browser (Cmd+Shift+R)")
