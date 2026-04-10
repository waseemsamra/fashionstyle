#!/bin/bash
# deploy-collections-lambda.sh
# Deploys the collections Lambda function to AWS

set -e  # Exit on error

echo "=================================================="
echo "🚀 Deploying Collections Lambda to AWS"
echo "=================================================="
echo ""

# Configuration - UPDATE THESE WITH YOUR VALUES
REGION="us-east-1"
LAMBDA_NAME="fashionstore-collections"
TABLE_NAME="fashionstore-data"
LAMBDA_ROLE_NAME="fashionstore-lambda-role"  # Update with your Lambda execution role name
API_ID="rvtv0snm8k"  # Your API Gateway ID
API_STAGE="prod"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Region: $REGION"
echo "   Lambda: $LAMBDA_NAME"
echo "   Table: $TABLE_NAME"
echo "   API ID: $API_ID"
echo ""

# Step 1: Check if AWS CLI is installed
echo "Step 1: Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI found${NC}"
echo ""

# Step 2: Verify AWS credentials
echo "Step 2: Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run: aws configure${NC}"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS credentials valid (Account: $ACCOUNT_ID)${NC}"
echo ""

# Step 3: Zip Lambda code
echo "Step 3: Zipping Lambda code..."
cd "$(dirname "$0")"
if [ ! -f "lambda/collectionsHandler.js" ]; then
    echo -e "${RED}❌ lambda/collectionsHandler.js not found${NC}"
    exit 1
fi

cd lambda
zip -j collectionsHandler.zip collectionsHandler.js
echo -e "${GREEN}✅ Lambda code zipped: lambda/collectionsHandler.zip${NC}"
cd ..
echo ""

# Step 4: Check if Lambda role exists
echo "Step 4: Checking Lambda execution role..."
ROLE_ARN=$(aws iam get-role --role-name "$LAMBDA_ROLE_NAME" --region "$REGION" --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ] || [ "$ROLE_ARN" == "None" ]; then
    echo -e "${YELLOW}⚠️  Role not found. Please provide the correct role name:${NC}"
    echo "   Current roles:"
    aws iam list-roles --query 'Roles[?contains(RoleName, `fashionstore`)].RoleName' --output table --region "$REGION"
    echo ""
    read -p "Enter Lambda execution role ARN: " ROLE_ARN
    if [ -z "$ROLE_ARN" ]; then
        echo -e "${RED}❌ Role ARN is required${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Role found: $ROLE_ARN${NC}"
fi
echo ""

# Step 5: Create or update Lambda function
echo "Step 5: Creating/Updating Lambda function..."
LAMBDA_EXISTS=$(aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" --query 'Configuration.FunctionName' --output text 2>/dev/null || echo "")

if [ -z "$LAMBDA_EXISTS" ] || [ "$LAMBDA_EXISTS" == "None" ]; then
    echo "Creating new Lambda function..."
    aws lambda create-function \
        --function-name "$LAMBDA_NAME" \
        --runtime nodejs20.x \
        --role "$ROLE_ARN" \
        --handler collectionsHandler.handler \
        --zip-file fileb://lambda/collectionsHandler.zip \
        --environment "Variables={TABLE_NAME=$TABLE_NAME}" \
        --timeout 30 \
        --memory-size 256 \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Lambda function created: $LAMBDA_NAME${NC}"
else
    echo "Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name "$LAMBDA_NAME" \
        --zip-file fileb://lambda/collectionsHandler.zip \
        --region "$REGION"
    
    # Update environment variables
    aws lambda update-function-configuration \
        --function-name "$LAMBDA_NAME" \
        --environment "Variables={TABLE_NAME=$TABLE_NAME}" \
        --timeout 30 \
        --memory-size 256 \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Lambda function updated: $LAMBDA_NAME${NC}"
fi
echo ""

# Step 6: Add DynamoDB permissions to Lambda role
echo "Step 6: Adding DynamoDB permissions to Lambda role..."
ROLE_NAME=$(echo "$ROLE_ARN" | cut -d'/' -f2)

POLICY_NAME="fashionstore-collections-policy"
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:BatchGetItem",
                    "dynamodb:Query"
                ],
                "Resource": "arn:aws:dynamodb:'"$REGION"':'"$ACCOUNT_ID"':table/'"$TABLE_NAME"'"
            }
        ]
    }'

echo -e "${GREEN}✅ DynamoDB permissions added${NC}"
echo ""

# Step 7: Add API Gateway permissions to Lambda
echo "Step 7: Adding API Gateway invoke permissions..."
aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "apigateway-invoke-collections" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/collections*" \
    --region "$REGION" || echo "Permission already exists, skipping..."

aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "apigateway-invoke-collections-post" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/collections*" \
    --region "$REGION" || echo "Permission already exists, skipping..."

aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "apigateway-invoke-collections-delete" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/DELETE/collections*" \
    --region "$REGION" || echo "Permission already exists, skipping..."

echo -e "${GREEN}✅ API Gateway invoke permissions added${NC}"
echo ""

# Step 8: Create API Gateway resources and methods
echo "Step 8: Creating API Gateway resources and methods..."

# Get the root resource ID
PARENT_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?path==`/`].id' \
    --output text)

echo "Root resource ID: $PARENT_ID"

# Create /collections resource
echo "Creating /collections resource..."
COLLECTIONS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$PARENT_ID" \
    --path-part "collections" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "Collections resource ID: $COLLECTIONS_RESOURCE_ID"

# Create /collections/{name} resource
echo "Creating /collections/{name} resource..."
NAME_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$COLLECTIONS_RESOURCE_ID" \
    --path-part "{name}" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "Name resource ID: $NAME_RESOURCE_ID"
echo ""

# Add GET method to /collections
echo "Adding GET method to /collections..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method GET \
    --authorization-type NONE \
    --region "$REGION"

# Add integration for GET /collections
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_NAME/invocations" \
    --region "$REGION"

echo -e "${GREEN}✅ GET /collections added${NC}"

# Add GET method to /collections/{name}
echo "Adding GET method to /collections/{name}..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --authorization-type NONE \
    --region "$REGION"

# Add integration for GET /collections/{name}
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_NAME/invocations" \
    --region "$REGION"

echo -e "${GREEN}✅ GET /collections/{name} added${NC}"

# Add POST method to /collections/{name}
echo "Adding POST method to /collections/{name}..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --authorization-type NONE \
    --request-parameters method.request.header.Content-Type=false \
    --region "$REGION"

# Add integration for POST /collections/{name}
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_NAME/invocations" \
    --passthrough-behavior WHEN_NO_MATCH \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region "$REGION"

echo -e "${GREEN}✅ POST /collections/{name} added${NC}"

# Add DELETE method to /collections/{name}
echo "Adding DELETE method to /collections/{name}..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method DELETE \
    --authorization-type NONE \
    --region "$REGION"

# Add integration for DELETE /collections/{name}
aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$NAME_RESOURCE_ID" \
    --http-method DELETE \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_NAME/invocations" \
    --region "$REGION"

echo -e "${GREEN}✅ DELETE /collections/{name} added${NC}"

# Add OPTIONS method for CORS
echo "Adding OPTIONS method for CORS..."
aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --request-parameters method.request.header.Access-Control-Request-Headers=false,method.request.header.Access-Control-Request-Method=false \
    --region "$REGION"

aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --integration-responses '{"statusCode": "200", "responseParameters": {"method.response.header.Access-Control-Allow-Headers": "'Content-Type,Authorization'", "method.response.header.Access-Control-Allow-Methods": "'GET,POST,DELETE,OPTIONS'", "method.response.header.Access-Control-Allow-Origin": "'*'"}}' \
    --region "$REGION"

aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$COLLECTIONS_RESOURCE_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true \
    --region "$REGION"

echo -e "${GREEN}✅ OPTIONS method for CORS added${NC}"
echo ""

# Step 9: Deploy API Gateway
echo "Step 9: Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo -e "${GREEN}✅ API Gateway deployed to stage: $API_STAGE${NC}"
echo ""

# Step 10: Test the deployment
echo "Step 10: Testing deployment..."
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE"

echo ""
echo "Testing GET /collections..."
curl -s "$API_URL/collections" | head -100
echo ""
echo ""

echo "Testing GET /collections/test..."
curl -s "$API_URL/collections/test" | head -100
echo ""
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "=================================================="
echo "🎉 Collections Lambda Deployed Successfully!"
echo "=================================================="
echo ""
echo "📋 API URLs:"
echo "   GET    collections: $API_URL/collections"
echo "   GET    collection: $API_URL/collections/{name}"
echo "   POST   collection: $API_URL/collections/{name}"
echo "   DELETE collection: $API_URL/collections/{name}"
echo ""
echo "🔧 Next Steps:"
echo "   1. Test with admin panel: Select products and save"
echo "   2. Test home page: Should load in 50-100ms"
echo "   3. Check CloudWatch logs for debugging"
echo ""
echo "📊 Monitor logs:"
echo "   aws logs tail /aws/lambda/$LAMBDA_NAME --follow"
echo ""
