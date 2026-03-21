#!/bin/bash
# Fix CORS for rvtv0snm8k API Gateway

REST_API_ID="rvtv0snm8k"
RESOURCE_ID="09hycq"  # /admin/users
REGION="us-east-1"

echo "🔧 Fixing CORS for /admin/users..."

# Delete existing OPTIONS method
aws apigateway delete-method \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --region $REGION 2>/dev/null

sleep 2

# Create new OPTIONS method
aws apigateway put-method \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1

# Add MOCK integration
aws apigateway put-integration \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method GET \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
  --region $REGION >/dev/null 2>&1

# Add method response
aws apigateway put-method-response \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Origin=true" \
    "method.response.header.Access-Control-Allow-Headers=true" \
    "method.response.header.Access-Control-Allow-Methods=true" \
  --region $REGION >/dev/null 2>&1

# Add integration response with proper CORS headers
aws apigateway put-integration-response \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters \
    "method.response.header.Access-Control-Allow-Origin='*'" \
    "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,X-Amz-Security-Token'" \
    "method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS'" \
  --region $REGION >/dev/null 2>&1

# Deploy
aws apigateway create-deployment \
  --rest-api-id $REST_API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1

echo "✅ CORS fixed for /admin/users"
echo "⏳ Waiting 5 seconds for deployment..."
sleep 5

# Test
echo "🧪 Testing CORS..."
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  "https://$REST_API_ID.execute-api.$REGION.amazonaws.com/prod/admin/users" \
  -o /dev/null -w "Status: %{http_code}\n"
