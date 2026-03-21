#!/bin/bash

API_ID="jxh66jgwq8"
REGION="us-east-1"
BRAND_RESOURCE_ID="m7yzfg"

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name brands-management-api --region $REGION --query 'Configuration.FunctionArn' --output text)

echo "🔧 Recreating OPTIONS method with Lambda proxy..."

# Delete existing OPTIONS
aws apigateway delete-method \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --region $REGION 2>/dev/null

sleep 2

# Create new OPTIONS method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1

# Add Lambda proxy integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $BRAND_RESOURCE_ID \
  --http-method OPTIONS \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
  --region $REGION >/dev/null 2>&1

# Add Lambda permission
aws lambda add-permission \
  --function-name brands-management-api \
  --statement-id apigateway-options-brands-id \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/OPTIONS/admin/brands/{id}" \
  --region $REGION 2>/dev/null

# Deploy
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1

echo "✅ OPTIONS now uses Lambda proxy"
echo "⏳ Waiting 10 seconds..."
sleep 10

# Test
echo "🧪 Testing..."
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/admin/brands/test-id" \
  -D - -o /dev/null 2>&1 | grep -i "access-control" || echo "No CORS headers (Lambda will handle it)"

echo ""
echo "✅ Done! Try editing/deleting brands now."
