#!/usr/bin/env python3
"""
Fix CORS for all API Gateway endpoints
"""
import boto3

api_id = 'rvtv0snm8k'
region = 'us-east-1'

client = boto3.client('apigateway', region_name=region)

print("🔧 Fixing CORS for API Gateway...\n")

# Get all resources
response = client.get_resources(restApiId=api_id, limit=500)
resources = response.get('items', [])

print(f"📊 Found {len(resources)} resources\n")

# Fix CORS for each resource
for resource in resources:
    path = resource.get('path', '')
    resource_id = resource.get('id', '')
    
    if path == '/':
        continue
    
    print(f"📝 Configuring CORS for: {path}")
    
    # Delete existing OPTIONS
    try:
        client.delete_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS'
        )
    except:
        pass
    
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
            }
        )
        
        # Add integration response with wildcard CORS
        client.put_integration_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseTemplates={'application/json': ''},
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,PATCH,OPTIONS'",
            }
        )
        
        print(f"   ✅ CORS configured")
    except Exception as e:
        print(f"   ⚠️ Error: {str(e)}")

# Deploy
print("\n📦 Deploying API to prod stage...")
try:
    client.create_deployment(restApiId=api_id, stageName='prod')
    print("✅ Deployment successful!")
except Exception as e:
    print(f"⚠️ Deployment error: {str(e)}")

print("\n⏳ Wait 2 minutes for deployment to propagate...")
print("\n✨ CORS fix complete! Refresh your site.")
