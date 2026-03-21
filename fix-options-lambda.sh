#!/bin/bash
# Fix OPTIONS to use Lambda proxy instead of MOCK

REST_API_ID="rvtv0snm8k"
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:536217686312:function:user-management-api"

echo "🔧 Configuring OPTIONS to use Lambda proxy..."

# Get /admin/users resource ID
RESOURCE_ID="09hycq"

# Delete existing OPTIONS
aws apigateway delete-method \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --region $REGION 2>/dev/null

sleep 2

# Create OPTIONS method
aws apigateway put-method \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION >/dev/null 2>&1

# Add Lambda proxy integration
aws apigateway put-integration \
  --rest-api-id $REST_API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
  --region $REGION >/dev/null 2>&1

# Add Lambda permission for OPTIONS
aws lambda add-permission \
  --function-name user-management-api \
  --statement-id apigateway-options-admin-users \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$REST_API_ID/*/OPTIONS/admin/users" \
  --region $REGION >/dev/null 2>&1

# Deploy
aws apigateway create-deployment \
  --rest-api-id $REST_API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1

echo "✅ OPTIONS now uses Lambda proxy"
echo "⏳ Waiting 10 seconds..."
sleep 10

# Test
echo "🧪 Testing..."
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  "https://$REST_API_ID.execute-api.$REGION.amazonaws.com/prod/admin/users" \
  -o /dev/null -w "Status: %{http_code}\n"

echo "✅ Done!"
