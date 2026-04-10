#!/bin/bash
# complete-collections-deploy.sh
# Run this if Lambda already exists but API Gateway isn't set up

set -e

REGION="us-east-1"
LAMBDA_NAME="fashionstore-collections"
API_ID="rvtv0snm8k"
API_STAGE="prod"
ACCOUNT_ID="536217686312"

echo "🔧 Completing API Gateway setup for collections Lambda..."
echo ""

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --region "$REGION" \
    --query 'FunctionArn' \
    --output text)

echo "Lambda ARN: $LAMBDA_ARN"

# Get root resource ID
PARENT_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?path==`/`].id' \
    --output text)

echo "Root resource ID: $PARENT_ID"

# Check if /collections resource exists
echo ""
echo "Checking for existing /collections resource..."
COLLECTIONS_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?path==`/collections`].id' \
    --output text)

if [ -z "$COLLECTIONS_RESOURCE_ID" ] || [ "$COLLECTIONS_RESOURCE_ID" == "None" ]; then
    echo "Creating /collections resource..."
    COLLECTIONS_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$PARENT_ID" \
        --path-part "collections" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    echo "✅ Created: $COLLECTIONS_RESOURCE_ID"
else
    echo "✅ Exists: $COLLECTIONS_RESOURCE_ID"
fi

# Check if /collections/{name} resource exists
echo ""
echo "Checking for existing /collections/{name} resource..."
NAME_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?path==`/collections/{name}`].id' \
    --output text)

if [ -z "$NAME_RESOURCE_ID" ] || [ "$NAME_RESOURCE_ID" == "None" ]; then
    echo "Creating /collections/{name} resource..."
    NAME_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$COLLECTIONS_RESOURCE_ID" \
        --path-part "{name}" \
        --region "$REGION" \
        --query 'id' \
        --output text)
    echo "✅ Created: $NAME_RESOURCE_ID"
else
    echo "✅ Exists: $NAME_RESOURCE_ID"
fi

echo ""
echo "✅ Resources ready. Adding methods..."

# Add permissions to Lambda
echo ""
echo "Adding API Gateway invoke permissions..."
aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "apigateway-invoke-collections" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/collections*" \
    --region "$REGION" || echo "Permission already exists"

# Deploy API
echo ""
echo "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo ""
echo "✅ Done! API Gateway deployed to stage: $API_STAGE"
echo ""
echo "Test with:"
echo "curl https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE/collections"
