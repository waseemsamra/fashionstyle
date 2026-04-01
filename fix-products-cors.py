#!/usr/bin/env python3
"""
Fix CORS for all API Gateway endpoints to allow Amplify app
"""
import boto3
import time

api_id = 'rvtv0snm8k'
region = 'us-east-1'

# Allowed origins
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:4173',
    'https://main.d1l8ayoz0simv1.amplifyapp.com',
    '*'
]

client = boto3.client('apigateway', region_name=region)

print("🔧 Fixing CORS for all API Gateway endpoints...\n")

# Get all resources
response = client.get_resources(restApiId=api_id, limit=500)
resources = response.get('items', [])

print(f"📊 Found {len(resources)} resources\n")

# Fix CORS for each resource
for resource in resources:
    path = resource.get('path', '')
    resource_id = resource.get('id', '')
    
    # Skip root
    if path == '/':
        continue
    
    print(f"📝 Fixing CORS for: {path}")
    
    # Delete existing OPTIONS method
    try:
        client.delete_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS'
        )
        time.sleep(0.5)
    except Exception as e:
        pass  # May not exist
    
    # Create OPTIONS method
    try:
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
                'method.response.header.Access-Control-Allow-Credentials': True,
            }
        )
        
        # Add integration response with wildcard origin
        client.put_integration_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseTemplates={'application/json': ''},
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
                'method.response.header.Access-Control-Allow-Credentials': "'false'",
            }
        )
        
        print(f"   ✅ Fixed")
    except Exception as e:
        print(f"   ⚠️ Error: {str(e)}")

# Deploy
print("\n📦 Deploying API to prod stage...")
try:
    client.create_deployment(restApiId=api_id, stageName='prod')
    print("✅ Deployment started")
except Exception as e:
    print(f"⚠️ Deployment error: {str(e)}")
    # Try updating existing deployment
    try:
        deployments = client.get_deployments(restApiId=api_id)
        if deployments.get('items'):
            deployment_id = deployments['items'][0]['id']
            client.update_stage(
                restApiId=api_id,
                stageName='prod',
                patchOperations=[
                    {'op': 'replace', 'path': '/deploymentId', 'value': deployment_id}
                ]
            )
            print("✅ Stage updated")
    except Exception as e2:
        print(f"⚠️ Update error: {str(e2)}")

print("\n⏳ Waiting 15 seconds for deployment to propagate...")
time.sleep(15)

# Test CORS
print("\n🧪 Testing CORS...")
import requests

test_endpoints = [
    '/products',
    '/brands/v2',
    '/admin/analytics/dashboard',
]

for endpoint in test_endpoints:
    try:
        response = requests.options(
            f'https://{api_id}.execute-api.{region}.amazonaws.com/prod{endpoint}',
            headers={
                'Origin': 'https://main.d1l8ayoz0simv1.amplifyapp.com',
                'Access-Control-Request-Method': 'GET'
            },
            timeout=10
        )
        allow_origin = response.headers.get('Access-Control-Allow-Origin', 'NOT SET')
        print(f"  {endpoint}: {allow_origin}")
    except Exception as e:
        print(f"  {endpoint}: Error - {str(e)}")

print("\n✅ CORS fix complete!")
print("\n📝 Note: If you still see issues, you may need to:")
print("   1. Wait a few more minutes for full deployment")
print("   2. Clear browser cache")
print("   3. Check CloudWatch logs for errors")
