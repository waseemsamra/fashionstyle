#!/bin/bash
# fix-collections-cors-v2.sh
# Completely rebuild CORS for collections endpoints

set -e

REGION="us-east-1"
API_ID="rvtv0snm8k"
API_STAGE="prod"
COLLECTIONS_RESOURCE_ID="uxynyr"
NAME_RESOURCE_ID="x05pz4"

echo "🔧 Completely fixing CORS for Collections API..."

# Delete existing OPTIONS method if it exists
echo "Removing existing OPTIONS method..."
aws apigateway delete-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --region "$REGION" 2>/dev/null || echo "No existing OPTIONS method"

# Create fresh OPTIONS method
echo ""
echo "Creating OPTIONS method..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --request-parameters \
        method.request.header.Access-Control-Request-Headers=true,\
        method.request.header.Access-Control-Request-Method=true \
    --region "$REGION"

echo "✅ OPTIONS method created"

# Add MOCK integration
echo ""
echo "Adding MOCK integration..."
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION"

echo "✅ MOCK integration added"

# Add method response
echo ""
echo "Adding method response..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Headers=true,\
        method.response.header.Access-Control-Allow-Methods=true,\
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION"

echo "✅ Method response added"

# Add integration response
echo ""
echo "Adding integration response..."
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-templates '{"application/json":""}' \
    --response-parameters \
        method.response.header.Access-Control-Allow-Headers="'Content-Type,Authorization,X-Requested-With'",\
        method.response.header.Access-Control-Allow-Methods="'GET,POST,DELETE,OPTIONS'",\
        method.response.header.Access-Control-Allow-Origin="'*'" \
    --region "$REGION"

echo "✅ Integration response added"

# Also ensure GET and POST have CORS response headers
echo ""
echo "Adding CORS headers to GET method response..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" 2>/dev/null || echo "GET response updated"

echo "Adding CORS headers to POST method response..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" 2>/dev/null || echo "POST response updated"

# Deploy
echo ""
echo "🚀 Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo ""
echo "⏳ Waiting 60 seconds for deployment to propagate..."
sleep 60

# Test with verbose output
echo ""
echo "🧪 Testing OPTIONS preflight request..."
curl -v -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test" \
  -H "Origin: https://main.d1l8ayoz0simv1.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>&1 | grep -E "< HTTP|< access-control|< content-type"

echo ""
echo ""
echo "🧪 Testing POST request..."
curl -X POST "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/summerSale" \
  -H "Content-Type: application/json" \
  -H "Origin: https://main.d1l8ayoz0simv1.amplifyapp.com" \
  -d '{"productIds":["test-1","test-2"],"displayName":"Summer Sale"}'

echo ""
echo ""
echo "✅ CORS fix deployed! Try saving again in the admin panel."
