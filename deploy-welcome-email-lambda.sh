#!/bin/bash

# Deploy SendWelcomeEmail Lambda and add to API Gateway

set -e

REGION="us-east-1"
FUNCTION_NAME="SendWelcomeEmail"
API_NAME="fashion-store-api"

echo "🚀 Deploying SendWelcomeEmail Lambda..."

# Create deployment package
cd /Users/apple/Downloads/fashionstyle
zip -j lambda-send-welcome-email.zip lambda-send-welcome-email.js

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-send-welcome-email.zip \
        --region $REGION
else
    echo "📝 Creating new Lambda function..."
    
    # Get the default Lambda execution role
    ROLE_ARN=$(aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text --region $REGION 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ARN" ]; then
        echo "❌ Lambda execution role not found. Creating..."
        aws iam create-role \
            --role-name lambda-execution-role \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }' \
            --region $REGION
        
        # Attach policies
        aws iam attach-role-policy \
            --role-name lambda-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION
        
        aws iam attach-role-policy \
            --role-name lambda-execution-role \
            --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess \
            --region $REGION
        
        ROLE_ARN=$(aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text --region $REGION)
    fi
    
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler lambda-send-welcome-email.handler \
        --zip-file fileb://lambda-send-welcome-email.zip \
        --region $REGION \
        --timeout 30 \
        --memory-size 256
fi

# Add SES permissions if not already present
echo "🔐 Adding SES permissions..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id ses-invoke \
    --action lambda:InvokeFunction \
    --principal ses.amazonaws.com \
    --source-service ses.amazonaws.com \
    --region $REGION 2>/dev/null || echo "Permission may already exist"

# Get API Gateway ID
echo "🔍 Finding API Gateway..."
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region $REGION)

if [ -z "$API_ID" ]; then
    echo "⚠️ API Gateway '$API_NAME' not found. Please create it first or provide the API ID manually."
    echo "Usage: API_ID=your-api-id $0"
    exit 1
fi

echo "✅ Found API Gateway: $API_ID"

# Create resource for send-welcome-email
echo "📍 Creating API Gateway resource..."
RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $(aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/'].id" --output text) \
    --path-part send-welcome-email \
    --region $REGION \
    --query "id" --output text)

# Create POST method
echo "🔗 Creating POST method..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --request-parameters method.request.header.Content-Type=true \
    --region $REGION

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query "Configuration.FunctionArn" --output text --region $REGION)

# Set up method integration
echo "🔌 Setting up Lambda integration..."
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations \
    --region $REGION

# Add CORS headers to integration response
echo "📮 Configuring CORS..."
aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Origin="'*'" \
    --region $REGION

# Create method response
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Origin=true \
    --region $REGION

# Add Lambda permission for API Gateway
echo "🔑 Adding API Gateway invoke permission..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
    --region $REGION

# Deploy API
echo "🚀 Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Deploy send-welcome-email endpoint" \
    --region $REGION

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Endpoint URL:"
echo "   https://$API_ID.execute-api.$REGION.amazonaws.com/prod/send-welcome-email"
echo ""
echo "🧪 Test the endpoint:"
echo "   curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/prod/send-welcome-email \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"firstName\":\"Test\",\"lastName\":\"User\",\"tempPassword\":\"TempPass123!\"}'"
echo ""

# Clean up
rm -f lambda-send-welcome-email.zip

