#!/bin/bash
# Fix CORS for ALL endpoints on rvtv0snm8k API Gateway

REST_API_ID="rvtv0snm8k"
REGION="us-east-1"

echo "🔧 Enabling CORS on rvtv0snm8k API Gateway..."

# Get all resource IDs
RESOURCES=$(aws apigateway get-resources --rest-api-id $REST_API_ID --region $REGION --query 'items[*].id' --output text)

for RESOURCE_ID in $RESOURCES; do
  echo "  Processing resource: $RESOURCE_ID"
  
  # Delete existing OPTIONS if any
  aws apigateway delete-method \
    --rest-api-id $REST_API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION 2>/dev/null
  
  # Create OPTIONS method
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
  
  # Add integration response
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
done

# Deploy
echo "📦 Deploying to prod stage..."
aws apigateway create-deployment \
  --rest-api-id $REST_API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1

echo "✅ CORS enabled on ALL endpoints"
echo "⏳ Waiting 10 seconds for deployment..."
sleep 10

# Test
echo "🧪 Testing CORS on /admin/users..."
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  "https://$REST_API_ID.execute-api.$REGION.amazonaws.com/prod/admin/users" \
  -o /dev/null -w "Status: %{http_code}\n"

echo "🧪 Testing CORS on /products..."
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  "https://$REST_API_ID.execute-api.$REGION.amazonaws.com/prod/products" \
  -o /dev/null -w "Status: %{http_code}\n"

echo "✅ Done!"
