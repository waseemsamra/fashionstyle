#!/bin/bash

echo "🔧 Fixing CORS for Brands API Gateway..."

API_ID="rvtv0snm8k"
REGION="us-east-1"

echo "🔍 Looking up resource IDs..."

# Get all resources
RESOURCES=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --output json)

echo "$RESOURCES" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('items', []):
    print(f\"  {item['path']}: {item['id']}\")
"

# Find resource IDs dynamically
BRANDS_RESOURCE_ID=$(echo "$RESOURCES" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('items', []):
    if item.get('path') == '/admin/brands':
        print(item['id'])
        break
")

BRAND_RESOURCE_ID=$(echo "$RESOURCES" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('items', []):
    if item.get('path') == '/admin/brands/{id}':
        print(item['id'])
        break
")

if [ -z "$BRANDS_RESOURCE_ID" ] || [ -z "$BRAND_RESOURCE_ID" ]; then
  echo "❌ Could not find brand resources. You may need to run deploy-brands-api.sh first."
  exit 1
fi

echo "✅ Found /admin/brands resource: $BRANDS_RESOURCE_ID"
echo "✅ Found /admin/brands/{id} resource: $BRAND_RESOURCE_ID"

# Update OPTIONS method for /admin/brands/{id}
echo "📝 Updating /admin/brands/{id} OPTIONS method..."

# Delete existing OPTIONS
aws apigateway delete-method \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --region $REGION 2>/dev/null

sleep 1

# Create new OPTIONS method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --request-parameters "method.request.header.Origin=false,method.request.header.Access-Control-Request-Method=false,method.request.header.Access-Control-Request-Headers=false" \
  --region $REGION >/dev/null 2>&1

# Add MOCK integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method GET \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
  --passthrough-behavior WHEN_NO_MATCH \
  --region $REGION >/dev/null 2>&1

# Add method response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Origin=true" \
    "method.response.header.Access-Control-Allow-Headers=true" \
    "method.response.header.Access-Control-Allow-Methods=true" \
    "method.response.header.Access-Control-Allow-Credentials=true" \
  --region $REGION >/dev/null 2>&1

# Add integration response with CORS headers
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-templates "application/json=" \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Origin='*'" \
    "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'" \
    "method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS'" \
    "method.response.header.Access-Control-Allow-Credentials='true'" \
  --region $REGION >/dev/null 2>&1

echo "✅ Updated /admin/brands/{id} OPTIONS"

# Also update /admin/brands resource
echo "📝 Updating /admin/brands OPTIONS method..."

aws apigateway delete-method \
  --rest-api-id $API_ID \
  --resource-id $BRANDS_RESOURCE_ID \
  --http-method OPTIONS \
  --region $REGION 2>/dev/null

sleep 1

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $BRANDS_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $BRANDS_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method GET \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
  --region $REGION >/dev/null 2>&1

aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $BRANDS_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Origin=true" \
    "method.response.header.Access-Control-Allow-Headers=true" \
    "method.response.header.Access-Control-Allow-Methods=true" \
  --region $REGION >/dev/null 2>&1

aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $BRANDS_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-templates "application/json=" \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Origin='*'" \
    "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'" \
    "method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS'" \
  --region $REGION >/dev/null 2>&1

echo "✅ Updated /admin/brands OPTIONS"

# Deploy the API
echo "📦 Deploying API..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1

echo "✅ API deployed"

echo ""
echo "⏳ Waiting 10 seconds for deployment to propagate..."
sleep 10

# Test CORS with Amplify origin
echo "🧪 Testing CORS..."
curl -s -X OPTIONS \
  -H "Origin: https://main.d1l8ayoz0simv1.amplifyapp.com" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/admin/brands/test-id" \
  -D - -o /dev/null 2>&1 | grep -i "access-control"

echo ""
echo "🧪 Testing localhost origin..."
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/admin/brands/test-id" \
  -D - -o /dev/null 2>&1 | grep -i "access-control"

echo ""
echo "✅ CORS fix complete! Try editing/deleting brands now."
