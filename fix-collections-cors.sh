#!/bin/bash
# fix-collections-cors.sh
# Adds CORS support to collections API Gateway endpoints

set -e

REGION="us-east-1"
API_ID="rvtv0snm8k"
API_STAGE="prod"
COLLECTIONS_RESOURCE_ID="uxynyr"
NAME_RESOURCE_ID="x05pz4"

echo "🔧 Adding CORS to Collections API..."

# Add OPTIONS method to /collections/{name} for CORS preflight
echo ""
echo "Adding OPTIONS method to /collections/{name}..."

aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" || echo "Method already exists"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION" || echo "Integration already exists"

aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Headers=true,\
        method.response.header.Access-Control-Allow-Methods=true,\
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" || echo "Method response already exists"

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
    --region "$REGION" || echo "Integration response already exists"

echo "✅ OPTIONS method added to /collections/{name}"

# Also add CORS headers to GET method responses
echo ""
echo "Adding CORS headers to GET method..."

aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" || echo "GET method response already exists"

aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --status-code 200 \
    --response-parameters \
        method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" || echo "POST method response already exists"

echo "✅ CORS headers added to GET/POST methods"

# Deploy API
echo ""
echo "🚀 Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo ""
echo "✅ API deployed! Wait 30 seconds for changes to propagate..."
sleep 30

echo ""
echo "🧪 Testing POST request..."
curl -v -X POST "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["test-1"],"displayName":"Test"}'

echo ""
echo ""
echo "✅ CORS fix applied! Try saving a collection again in the admin panel."
