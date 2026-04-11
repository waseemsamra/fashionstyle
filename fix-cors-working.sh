#!/bin/bash
# fix-cors-working.sh
# Correct CORS setup with proper AWS CLI syntax

REGION="us-east-1"
API_ID="rvtv0snm8k"
API_STAGE="prod"
NAME_RESOURCE_ID="x05pz4"

echo "🔧 Fixing CORS (correct syntax)..."

# Delete existing OPTIONS
aws apigateway delete-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --region "$REGION" 2>/dev/null || true

# Create OPTIONS method
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION"

# MOCK integration
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION"

# Method response (JSON syntax for multiple params)
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' \
    --region "$REGION"

# Integration response
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-templates '{"application/json":""}' \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,Authorization'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
    --region "$REGION"

# POST method CORS
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' \
    --region "$REGION" 2>/dev/null || true

# GET method CORS
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' \
    --region "$REGION" 2>/dev/null || true

# Deploy
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo "✅ Deployed! Waiting 60 seconds..."
sleep 60

# Test
echo "🧪 Testing..."
curl -s -X POST "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test3" \
  -H "Content-Type: application/json" \
  -H "Origin: https://example.com" \
  -d '{"productIds":["p1"],"displayName":"Test"}'

echo ""
echo "✅ Done! Refresh browser (Cmd+Shift+R) and try saving."
