#!/bin/bash
# fix-options-preflight.sh
# Fix the OPTIONS method to properly proxy to Lambda

set -e

REGION="us-east-1"
API_ID="rvtv0snm8k"
API_STAGE="prod"
NAME_RESOURCE_ID="x05pz4"
LAMBDA_ARN="arn:aws:lambda:us-east-1:536217686312:function:fashionstore-collections"

echo "🔧 Fixing OPTIONS preflight..."

# Delete existing OPTIONS
aws apigateway delete-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --region "$REGION" 2>/dev/null || echo "No OPTIONS to delete"

# Create OPTIONS with no auth
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION"

echo "✅ OPTIONS method created"

# Add Lambda proxy integration for OPTIONS
INTEGRATION_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$INTEGRATION_URI" \
    --region "$REGION"

echo "✅ Lambda proxy integration added"

# Add method response
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-models '{"application/json":"Empty"}' \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' \
    --region "$REGION"

echo "✅ Method response added"

# Add Lambda permission for OPTIONS
aws lambda add-permission \
    --function-name fashionstore-collections \
    --statement-id "api-gateway-options-$(date +%s)" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:536217686312:$API_ID/*/*/collections*" \
    --region "$REGION" 2>/dev/null || echo "Permission exists"

echo "✅ Lambda permission added"

# Deploy
echo "🚀 Deploying..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo "⏳ Waiting 60 seconds..."
sleep 60

# Test OPTIONS preflight
echo "🧪 Testing OPTIONS..."
curl -v -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections/test" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  2>&1 | grep -E "< HTTP|access-control"

echo ""
echo "✅ Done! Refresh browser and try saving."
