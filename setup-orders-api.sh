#!/bin/bash

# AWS CLI Script to Setup Orders API Gateway Endpoints
# This script adds /users/{userId}/orders endpoints to existing API Gateway

set -e

# Configuration
API_ID="8ur8l436ff"
REGION="us-east-1"
LAMBDA_FUNCTION="fashionstore-prod-orders-v2"
STAGE_NAME="prod"

echo "🚀 Setting up Orders API Gateway Endpoints"
echo "=========================================="
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "Lambda: $LAMBDA_FUNCTION"
echo ""

# Get Lambda ARN
echo "📋 Getting Lambda ARN..."
LAMBDA_ARN=$(aws lambda get-function \
  --function-name "$LAMBDA_FUNCTION" \
  --region "$REGION" \
  --query 'Configuration.FunctionArn' \
  --output text)
echo "Lambda ARN: $LAMBDA_ARN"
echo ""

# Get Root Resource ID
echo "📋 Getting API Gateway Root Resource..."
ROOT_RESOURCE=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/`].id' \
  --output text)
echo "Root Resource ID: $ROOT_RESOURCE"
echo ""

# Check if /users resource exists
echo "📋 Checking for /users resource..."
USERS_RESOURCE=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/users`].id' \
  --output text)

if [ -z "$USERS_RESOURCE" ]; then
  echo "Creating /users resource..."
  USERS_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_RESOURCE" \
    --path-part "users" \
    --region "$REGION" \
    --query 'id' \
    --output text)
  echo "Created /users resource: $USERS_RESOURCE"
else
  echo "Found existing /users resource: $USERS_RESOURCE"
fi
echo ""

# Check if /users/{userId} resource exists
echo "📋 Checking for /users/{userId} resource..."
USER_ID_RESOURCE=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/users/{userId}`].id' \
  --output text)

if [ -z "$USER_ID_RESOURCE" ]; then
  echo "Creating /users/{userId} resource..."
  USER_ID_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$USERS_RESOURCE" \
    --path-part "{userId}" \
    --region "$REGION" \
    --query 'id' \
    --output text)
  echo "Created /users/{userId} resource: $USER_ID_RESOURCE"
else
  echo "Found existing /users/{userId} resource: $USER_ID_RESOURCE"
fi
echo ""

# Check if /users/{userId}/orders resource exists
echo "📋 Checking for /users/{userId}/orders resource..."
ORDERS_RESOURCE=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/users/{userId}/orders`].id' \
  --output text)

if [ -z "$ORDERS_RESOURCE" ]; then
  echo "Creating /users/{userId}/orders resource..."
  ORDERS_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$USER_ID_RESOURCE" \
    --path-part "orders" \
    --region "$REGION" \
    --query 'id' \
    --output text)
  echo "Created /users/{userId}/orders resource: $ORDERS_RESOURCE"
else
  echo "Found existing /users/{userId}/orders resource: $ORDERS_RESOURCE"
fi
echo ""

# Check if POST method exists
echo "📋 Checking for POST method..."
POST_EXISTS=$(aws apigateway get-method \
  --rest-api-id "$API_ID" \
  --resource-id "$ORDERS_RESOURCE" \
  --http-method POST \
  --region "$REGION" 2>/dev/null || echo "")

if [ -z "$POST_EXISTS" ]; then
  echo "Creating POST method..."
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method POST \
    --authorization-type NONE \
    --region "$REGION" \
    --no-request-parameters \
    > /dev/null
  
  echo "Creating POST integration..."
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region "$REGION" \
    > /dev/null
  echo "POST method created"
else
  echo "POST method already exists"
fi
echo ""

# Check if GET method exists
echo "📋 Checking for GET method..."
GET_EXISTS=$(aws apigateway get-method \
  --rest-api-id "$API_ID" \
  --resource-id "$ORDERS_RESOURCE" \
  --http-method GET \
  --region "$REGION" 2>/dev/null || echo "")

if [ -z "$GET_EXISTS" ]; then
  echo "Creating GET method..."
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method GET \
    --authorization-type NONE \
    --region "$REGION" \
    --no-request-parameters \
    > /dev/null
  
  echo "Creating GET integration..."
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region "$REGION" \
    > /dev/null
  echo "GET method created"
else
  echo "GET method already exists"
fi
echo ""

# Check if OPTIONS method exists
echo "📋 Checking for OPTIONS method..."
OPTIONS_EXISTS=$(aws apigateway get-method \
  --rest-api-id "$API_ID" \
  --resource-id "$ORDERS_RESOURCE" \
  --http-method OPTIONS \
  --region "$REGION" 2>/dev/null || echo "")

if [ -z "$OPTIONS_EXISTS" ]; then
  echo "Creating OPTIONS method (CORS)..."
  
  # Create OPTIONS method
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION" \
    --no-request-parameters \
    > /dev/null
  
  # Create MOCK integration
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method OPTIONS \
    --type MOCK \
    --integration-http-method POST \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION" \
    > /dev/null
  
  # Add method response headers
  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
      "method.response.header.Access-Control-Allow-Origin": true
    }' \
    --region "$REGION" \
    > /dev/null
  
  # Add integration response
  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$ORDERS_RESOURCE" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      "method.response.header.Access-Control-Allow-Methods": "'GET,POST,OPTIONS'",
      "method.response.header.Access-Control-Allow-Origin": "'*'"
    }' \
    --region "$REGION" \
    > /dev/null
  
  echo "OPTIONS method created with CORS"
else
  echo "OPTIONS method already exists"
fi
echo ""

# Add Lambda permission for API Gateway
echo "📋 Adding Lambda permission for API Gateway..."
aws lambda add-permission \
  --function-name "$LAMBDA_FUNCTION" \
  --statement-id "apigateway-orders-$(date +%s)" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query Account --output text):${API_ID}/*/*" \
  --region "$REGION" \
  2>/dev/null || echo "Permission may already exist"
echo ""

# Deploy API
echo "🚀 Deploying API to $STAGE_NAME stage..."
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --region "$REGION" \
  --description "Deployed via CLI $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  > /dev/null
echo "API deployed successfully!"
echo ""

# Summary
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "API Endpoints:"
echo "  POST: https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/users/{userId}/orders"
echo "  GET:  https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/users/{userId}/orders"
echo ""
echo "Test with:"
echo "  curl -X GET \"https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/users/TEST123/orders\""
echo ""
echo "  curl -X POST \"https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/users/TEST123/orders\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"orderId\":\"ORD-123\",\"items\":[],\"totalPrice\":99.99}'"
echo ""
