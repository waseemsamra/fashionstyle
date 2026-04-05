#!/bin/bash

echo "🚀 Deploying Brands Management..."

REGION="us-east-1"
LAMBDA_NAME="brands-management-api"
BRANDS_TABLE="fashionstore-brands"
IAM_ROLE="lambda-user-management-role"

# Step 1: Create DynamoDB table
echo "1️⃣ Creating DynamoDB table: $BRANDS_TABLE..."
aws dynamodb create-table \
  --table-name $BRANDS_TABLE \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "Table may already exist"

echo "✅ DynamoDB table ready"

# Step 2: Create deployment package
echo "2️⃣ Creating deployment package..."
cd /Users/apple/Downloads/fashionstyle/lambda
zip -r ../brands-management.zip brandsManagement.js node_modules/ 2>/dev/null
cd ..
echo "✅ Package created"

# Step 3: Create or update Lambda
echo "3️⃣ Deploying Lambda function..."
if aws lambda get-function --function-name $LAMBDA_NAME --region $REGION >/dev/null 2>&1; then
  echo "🔄 Updating existing Lambda..."
  aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://brands-management.zip \
    --region $REGION >/dev/null 2>&1
else
  echo "✨ Creating new Lambda..."
  aws lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/$IAM_ROLE \
    --handler brandsManagement.handler \
    --zip-file fileb://brands-management.zip \
    --environment Variables="{BRANDS_TABLE=$BRANDS_TABLE}" \
    --timeout 30 \
    --memory-size 256 \
    --region $REGION >/dev/null 2>&1
fi
echo "✅ Lambda deployed"

# Step 4: Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name $LAMBDA_NAME --region $REGION --query 'Configuration.FunctionArn' --output text)
echo "📦 Lambda ARN: $LAMBDA_ARN"

# Step 5: Create API Gateway
echo "5️⃣ Setting up API Gateway..."
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='brands-management-api'].id" --output text)

if [ -z "$API_ID" ]; then
  echo "✨ Creating new API Gateway..."
  API_ID=$(aws apigateway create-rest-api \
    --name "brands-management-api" \
    --description "Brands Management API" \
    --region $REGION \
    --query 'id' --output text)
fi
echo "📡 API Gateway ID: $API_ID"

# Get root resource
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text)

# Create /admin resource
ADMIN_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part admin \
  --region $REGION \
  --query 'id' --output text 2>/dev/null || aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/admin'].id" --output text)

# Create /admin/brands resource
BRANDS_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ADMIN_ID \
  --path-part brands \
  --region $REGION \
  --query 'id' --output text 2>/dev/null || aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/admin/brands'].id" --output text)

# Create /admin/brands/{id} resource
BRAND_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $BRANDS_ID \
  --path-part "{id}" \
  --region $REGION \
  --query 'id' --output text)

echo "✅ API Gateway resources created"

# Step 6: Create methods
echo "6️⃣ Creating API methods..."

# Function to create method with Lambda proxy
create_method() {
  local resource_id=$1
  local http_method=$2
  
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $resource_id \
    --http-method $http_method \
    --authorization-type NONE \
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

# OPTIONS methods for CORS
create_method $BRANDS_ID "OPTIONS"
create_method $BRAND_ID "OPTIONS"

# CRUD methods
create_method $BRANDS_ID "GET"
create_method $BRANDS_ID "POST"
create_method $BRAND_ID "PUT"
create_method $BRAND_ID "DELETE"

echo "✅ API methods created"

# Step 7: Add Lambda permissions
echo "7️⃣ Adding Lambda permissions..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Permissions for /admin/brands
for method in GET POST OPTIONS; do
  aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-$method \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/$method/admin/brands" \
    --region $REGION 2>/dev/null || true
done

# Permissions for /admin/brands/{id}
for method in PUT DELETE OPTIONS; do
  aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-$method-id \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/$method/admin/brands/*" \
    --region $REGION 2>/dev/null || true
done

echo "✅ Lambda permissions added"

# Step 8: Deploy API
echo "8️⃣ Deploying API to prod stage..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION >/dev/null 2>&1
echo "✅ API deployed"

# Clean up
rm -f brands-management.zip

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Brands Management API Deployed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 API Endpoint:"
echo "   https://$API_ID.execute-api.$REGION.amazonaws.com/prod/admin/brands"
echo ""
echo "🔧 Available Endpoints:"
echo "   GET    /admin/brands      - List all brands"
echo "   POST   /admin/brands      - Create brand"
echo "   PUT    /admin/brands/:id  - Update brand"
echo "   DELETE /admin/brands/:id  - Delete brand"
echo ""
echo "📊 DynamoDB Table:"
echo "   Name: $BRANDS_TABLE"
echo "   Key: id (String)"
echo ""
