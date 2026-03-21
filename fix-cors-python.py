#!/usr/bin/env python3
import boto3

api_id = 'jxh66jgwq8'
region = 'us-east-1'
brands_resource_id = 'xlmsc0'  # /admin/brands
brand_resource_id = 'm7yzfg'   # /admin/brands/{id}

client = boto3.client('apigateway', region_name=region)

print("🔧 Configuring CORS for Brands API...")

# Update /admin/brands OPTIONS
print("📝 Updating /admin/brands OPTIONS...")
client.put_integration_response(
    restApiId=api_id,
    resourceId=brands_resource_id,
    httpMethod='OPTIONS',
    statusCode='200',
    responseTemplates={'application/json': ''},
    responseParameters={
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
    }
)

# Update /admin/brands/{id} OPTIONS
print("📝 Updating /admin/brands/{id} OPTIONS...")
client.put_integration_response(
    restApiId=api_id,
    resourceId=brand_resource_id,
    httpMethod='OPTIONS',
    statusCode='200',
    responseTemplates={'application/json': ''},
    responseParameters={
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
    }
)

# Deploy
print("📦 Deploying API...")
client.create_deployment(restApiId=api_id, stageName='prod')

print("✅ CORS configured! Waiting 10 seconds for deployment...")
import time
time.sleep(10)

# Test
print("🧪 Testing CORS...")
import requests
response = requests.options(
    f'https://{api_id}.execute-api.{region}.amazonaws.com/prod/admin/brands',
    headers={
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
    }
)
print(f"Status: {response.status_code}")
print(f"CORS Headers: {dict(response.headers)}")

print("\n✅ Done! Refresh your browser now.")
