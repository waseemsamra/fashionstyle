#!/bin/bash
# add-api-methods.sh
# Adds GET, POST, DELETE, OPTIONS methods to API Gateway

set -e

REGION="us-east-1"
API_ID="rvtv0snm8k"
API_STAGE="prod"
ACCOUNT_ID="536217686312"
LAMBDA_NAME="fashionstore-collections"

echo "🔧 Adding HTTP methods to API Gateway..."
echo ""

# Get resource IDs
COLLECTIONS_RESOURCE_ID="uxynyr"
NAME_RESOURCE_ID="x05pz4"
LAMBDA_ARN="arn:aws:lambda:us-east-1:$ACCOUNT_ID:function:$LAMBDA_NAME"
INTEGRATION_URI="arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# ========== /collections ==========
echo "Adding GET method to /collections..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method GET \
    --authorization-type NONE \
    --region "$REGION" || echo "Method already exists"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$INTEGRATION_URI" \
    --region "$REGION" || echo "Integration already exists"

echo "✅ GET /collections added"

# ========== /collections/{name} ==========
echo ""
echo "Adding GET method to /collections/{name}..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --authorization-type NONE \
    --region "$REGION" || echo "Method already exists"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$INTEGRATION_URI" \
    --region "$REGION" || echo "Integration already exists"

echo "✅ GET /collections/{name} added"

echo ""
echo "Adding POST method to /collections/{name}..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --authorization-type NONE \
    --request-parameters method.request.header.Content-Type=false \
    --region "$REGION" || echo "Method already exists"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$INTEGRATION_URI" \
    --region "$REGION" || echo "Integration already exists"

echo "✅ POST /collections/{name} added"

echo ""
echo "Adding DELETE method to /collections/{name}..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method DELETE \
    --authorization-type NONE \
    --region "$REGION" || echo "Method already exists"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method DELETE \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$INTEGRATION_URI" \
    --region "$REGION" || echo "Integration already exists"

echo "✅ DELETE /collections/{name} added"

echo ""
echo "Adding OPTIONS method for CORS..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" || echo "Method already exists"

aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION" || echo "Response already exists"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION" || echo "Integration already exists"

aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-templates '{"application/json":""}' \
    --response-parameters method.response.header.Access-Control-Allow-Headers="'Content-Type,Authorization'",method.response.header.Access-Control-Allow-Methods="'GET,POST,DELETE,OPTIONS'",method.response.header.Access-Control-Allow-Origin="'*'" \
    --region "$REGION" || echo "Integration response already exists"

echo "✅ OPTIONS method added"

# Deploy
echo ""
echo "🚀 Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Test your endpoints:"
echo ""
echo "  # List all collections"
echo "  curl https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections"
echo ""
echo "  # Get specific collection"
echo "  curl https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/featuredCollection"
echo ""
echo "  # Create a collection"
echo "  curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"productIds\":[\"prod-1\",\"prod-2\"],\"displayName\":\"Test\"}'"
echo ""
