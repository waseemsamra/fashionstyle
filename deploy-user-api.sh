#!/bin/bash

echo "🚀 Deploying User Management API to AWS..."
echo ""

# Configuration
REGION="us-east-1"
LAMBDA_FUNCTION_NAME="user-management-api"
API_GATEWAY_NAME="user-management-api"
USER_POOL_ID="us-east-1_qavi3JAVz"
USERS_TABLE="fashionstore-users"
IAM_ROLE_NAME="lambda-user-management-role"

# Step 1: Create IAM Role for Lambda
echo "1️⃣ Creating IAM role for Lambda..."

aws iam create-role \
  --role-name $IAM_ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --region $REGION 2>/dev/null || echo "Role already exists"

# Attach policies
aws iam attach-role-policy \
  --role-name $IAM_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --region $REGION

aws iam attach-role-policy \
  --role-name $IAM_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser \
  --region $REGION

aws iam attach-role-policy \
  --role-name $IAM_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess \
  --region $REGION

echo "✅ IAM role created/updated"
echo ""

# Step 2: Create deployment package
echo "2️⃣ Creating deployment package..."

cd lambda

# Install AWS SDK (if not already present)
if [ ! -d "node_modules" ]; then
  npm init -y
  npm install aws-sdk
fi

# Create zip file
zip -r ../user-management.zip userManagement.js node_modules/ 2>/dev/null

cd ..

echo "✅ Deployment package created"
echo ""

# Step 3: Create or update Lambda function
echo "3️⃣ Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION 2>/dev/null; then
  echo "🔄 Updating existing Lambda function..."
  
  aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://user-management.zip \
    --region $REGION
    
  aws lambda update-function-configuration \
    --function-name $LAMBDA_FUNCTION_NAME \
    --environment Variables="{USER_POOL_ID=$USER_POOL_ID,USERS_TABLE=$USERS_TABLE}" \
    --region $REGION
else
  echo "✨ Creating new Lambda function..."
  
  aws lambda create-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$IAM_ROLE_NAME \
    --handler userManagement.handler \
    --zip-file fileb://user-management.zip \
    --environment Variables="{USER_POOL_ID=$USER_POOL_ID,USERS_TABLE=$USERS_TABLE}" \
    --timeout 30 \
    --memory-size 256 \
    --region $REGION
fi

echo "✅ Lambda function deployed"
echo ""

# Step 4: Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)
echo "📦 Lambda ARN: $LAMBDA_ARN"
echo ""

# Step 5: Create or update API Gateway
echo "5️⃣ Setting up API Gateway..."

# Get existing API or create new one
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_GATEWAY_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
  echo "✨ Creating new API Gateway..."
  
  API_ID=$(aws apigateway create-rest-api \
    --name "$API_GATEWAY_NAME" \
    --description "User Management API" \
    --region $REGION \
    --query 'id' --output text)
  
  echo "📡 API Gateway created with ID: $API_ID"
else
  echo "🔄 Using existing API Gateway: $API_ID"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text)

# Create /admin resource
ADMIN_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part admin \
  --region $REGION \
  --query 'id' --output text)

# Create /admin/users resource
USERS_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ADMIN_RESOURCE_ID \
  --path-part users \
  --region $REGION \
  --query 'id' --output text)

# Create /admin/users/{userId} resource
USER_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $USERS_RESOURCE_ID \
  --path-part '{userId}' \
  --region $REGION \
  --query 'id' --output text)

echo "✅ API Gateway resources created"
echo ""

# Step 6: Create Methods
echo "6️⃣ Creating API methods..."

# Function to create method
create_method() {
  local resource_id=$1
  local http_method=$2
  local action=$3
  
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $resource_id \
    --http-method $http_method \
    --authorization-type NONE \
    --request-parameters method.request.header.Authorization=false \
    --region $REGION >/dev/null 2>&1
  
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $resource_id \
    --http-method $http_method \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations \
    --region $REGION >/dev/null 2>&1
  
  echo "  ✅ $http_method method created"
}

# OPTIONS method for CORS (on both resources)
create_method $USERS_RESOURCE_ID "OPTIONS" "cors"
create_method $USER_RESOURCE_ID "OPTIONS" "cors"

# GET /admin/users
create_method $USERS_RESOURCE_ID "GET" "getAllUsers"

# POST /admin/users
create_method $USERS_RESOURCE_ID "POST" "createUser"

# GET /admin/users/{userId}
create_method $USER_RESOURCE_ID "GET" "getUserById"

# PUT /admin/users/{userId}
create_method $USER_RESOURCE_ID "PUT" "updateUser"

# DELETE /admin/users/{userId}
create_method $USER_RESOURCE_ID "DELETE" "deleteUser"

echo "✅ API methods created"
echo ""

# Step 7: Add Lambda permissions for API Gateway
echo "7️⃣ Adding Lambda permissions..."

aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id apigateway-get-users \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/GET/admin/users" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id apigateway-post-users \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/POST/admin/users" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id apigateway-get-user \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/GET/admin/users/*" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id apigateway-put-user \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/PUT/admin/users/*" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

aws lambda add-permission \
  --function-name $LAMBDA_FUNCTION_NAME \
  --statement-id apigateway-delete-user \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/DELETE/admin/users/*" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

echo "✅ Lambda permissions added"
echo ""

# Step 8: Deploy API
echo "8️⃣ Deploying API to prod stage..."

aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1 || \
aws apigateway update-deployment \
  --rest-api-id $API_ID \
  --deployment-id $(aws apigateway get-deployments --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text) \
  --region $REGION >/dev/null 2>&1

echo "✅ API deployed"
echo ""

# Step 9: Enable CORS
echo "9️⃣ Enabling CORS..."

aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $USERS_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters method.response.header.Access-Control-Allow-Origin=true \
  --region $REGION >/dev/null 2>&1

aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $USERS_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters method.response.header.Access-Control-Allow-Origin='*\' \
  --region $REGION >/dev/null 2>&1

echo "✅ CORS enabled"
echo ""

# Step 10: Output API URL
INVOKE_URL=$(aws apigateway get-rest-api --rest-api-id $API_ID --region $REGION --query 'createdDate' --output text >/dev/null 2>&1 && \
  echo "https://$API_ID.execute-api.$REGION.amazonaws.com/prod")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 User Management API Deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 API Endpoint:"
echo "   https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "🔧 Available Endpoints:"
echo "   GET    /admin/users       - List all users"
echo "   POST   /admin/users       - Create new user"
echo "   GET    /admin/users/:id   - Get user by ID"
echo "   PUT    /admin/users/:id   - Update user"
echo "   DELETE /admin/users/:id   - Delete user"
echo ""
echo "💡 Update your .env file with:"
echo "   VITE_API_URL=https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""

# Clean up
rm -f user-management.zip

echo "✅ Deployment complete!"
