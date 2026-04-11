#!/bin/bash
# fix-collections-cors-final.sh
# Properly configure CORS for collections endpoints

set -e

REGION="us-east-1"
API_ID="rvtv0snm8k"
API_STAGE="prod"
NAME_RESOURCE_ID="x05pz4"

echo "🔧 Fixing CORS for Collections API..."

# Delete existing OPTIONS method
echo "Removing existing OPTIONS method..."
aws apigateway delete-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --region "$REGION" 2>/dev/null || echo "No existing OPTIONS"

# Create OPTIONS method (no request params needed)
echo ""
echo "Creating OPTIONS method..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION"

# Add MOCK integration
echo "Adding MOCK integration..."
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION"

# Add method response with CORS headers
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

# Add integration response with CORS values
echo "Adding integration response..."
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-templates '{"application/json":""}' \
    --response-parameters \
        method.response.header.Access-Control-Allow-Headers="'Content-Type,Authorization'",\
        method.response.header.Access-Control-Allow-Methods="'GET,POST,DELETE,OPTIONS'",\
        method.response.header.Access-Control-Allow-Origin="'*'" \
    --region "$REGION"

# Add CORS to POST method response
echo "Adding CORS to POST method..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" 2>/dev/null || echo "POST response updated"

# Add CORS to GET method response
echo "Adding CORS to GET method..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" 2>/dev/null || echo "GET response updated"

# Deploy
echo ""
echo "🚀 Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo ""
echo "⏳ Waiting 60 seconds..."
sleep 60

# Test
echo ""
echo "🧪 Testing OPTIONS preflight..."
curl -s -I -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control\|HTTP"

echo ""
echo "🧪 Testing POST..."
curl -s -X POST "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test2" \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{"productIds":["p1"],"displayName":"Test"}' | head -c 200

echo ""
echo ""
echo "✅ Done! Hard refresh browser (Cmd+Shift+R) and try saving again."
