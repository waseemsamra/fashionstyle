#!/bin/bash

# Fix API Gateway CORS for Orders API

set -e

API_ID="r7pc3n32db"
REGION="us-east-1"

echo "🔧 Fixing API Gateway CORS for Orders API..."

# Get API Gateway resources
echo "📋 Getting API Gateway resources..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output json)

# Extract the resource ID for /orders
RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/orders") | .id')

if [ -z "$RESOURCE_ID" ]; then
    echo "❌ Could not find /orders/{proxy+} resource"
    exit 1
fi

echo "✅ Found resource ID: $RESOURCE_ID"

# Get the method ID for PUT
echo "📋 Getting PUT method..."
METHOD_ID=$(aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method PUT --region $REGION --query 'id' --output text)

if [ -z "$METHOD_ID" ]; then
    echo "❌ Could not find PUT method for /orders/{proxy+}"
    exit 1
fi

echo "✅ Found PUT method ID: $METHOD_ID"

# Update method to add CORS
echo "🔄 Updating method with CORS..."
aws apigateway update-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method PUT \
    --region $REGION \
    --authorization-type NONE \
    --api-key-required false \
    --request-parameters "method.request.path.proxy=true" \
    --request-models '{"application/json":"Empty"}' \
    --integration-type HTTP \
    --integration-http-method PUT \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --integration-requests '{"application/json":"{\"statusCode\":200}"}' \
    --method-response '{"application/json":"Empty"}'

# Update integration response to add CORS headers
echo "🔄 Adding CORS headers to integration response..."
aws apigateway update-integration-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method PUT \
    --region $REGION \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-User-Agent,X-Amz-Content-Sha256,X-Amz-Content-Type,X-Amz-User-Agent,X-Amz-Target',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,HEAD',method.response.header.Access-Control-Allow-Credentials='true'"

# Update method response to add CORS headers
echo "🔄 Adding CORS headers to method response..."
aws apigateway update-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method PUT \
    --region $REGION \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-User-Agent,X-Amz-Content-Sha256,X-Amz-Content-Type,X-Amz-User-Agent,X-Amz-Target',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,HEAD',method.response.header.Access-Control-Allow-Credentials='true'"

# Also fix OPTIONS method for preflight
echo "📋 Getting OPTIONS method..."
OPTIONS_METHOD_ID=$(aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --region $REGION --query 'id' --output text)

if [ -z "$OPTIONS_METHOD_ID" ]; then
    echo "❌ Could not find OPTIONS method, creating it..."
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --region $REGION \
        --authorization-type NONE
    OPTIONS_METHOD_ID=$(aws apigateway get-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --region $REGION --query 'id' --output text)
fi

echo "✅ Found OPTIONS method ID: $OPTIONS_METHOD_ID"

# Update OPTIONS method with CORS
echo "🔄 Updating OPTIONS method with CORS..."
aws apigateway update-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION \
    --authorization-type NONE \
    --api-key-required false

# Update OPTIONS method response with CORS
echo "🔄 Adding CORS headers to OPTIONS method response..."
aws apigateway update-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin='*',method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,Authorization,X-Amz-Security-Token,X-Amz-User-Agent,X-Amz-Content-Sha256,X-Amz-Content-Type,X-Amz-User-Agent,X-Amz-Target',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS,HEAD',method.response.header.Access-Control-Allow-Credentials='true'"

# Deploy the changes
echo "🚀 Deploying API Gateway changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --region $REGION \
    --stage-name prod \
    --description "CORS fix for Amplify compatibility"

echo ""
echo "✅ API Gateway CORS fix complete!"
echo ""
echo "📋 Changes Applied:"
echo "   ✅ Added Access-Control-Allow-Origin: *"
echo "   ✅ Added Authorization to allowed headers"
echo "   ✅ Added PUT, DELETE, OPTIONS to allowed methods"
echo "   ✅ Added Access-Control-Allow-Credentials: true"
echo ""
echo "🧪 Test order status updates now!"
