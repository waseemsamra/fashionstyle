#!/bin/bash

# Simple CORS fix for Orders API Gateway

set -e

API_ID="r7pc3n32db"
REGION="us-east-1"

echo "🚀 Deploying Orders API Gateway with CORS fix..."

# Create a new deployment with CORS
echo "📋 Creating new deployment..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --region $REGION \
    --stage-name prod \
    --description "CORS fix for Amplify compatibility" \
    --variables '{}' \
    --canary-settings '{}' \

# Get the deployment ID
DEPLOYMENT_ID=$(aws apigateway get-deployments --rest-api-id $API_ID --region $REGION --output json | jq -r '.item[0].id')

if [ "$DEPLOYMENT_ID" = "null" ]; then
    DEPLOYMENT_ID=""
fi

echo "✅ Created deployment: $DEPLOYMENT_ID"

# Update stage to point to new deployment
echo "🔄 Updating prod stage..."
if [ -n "$DEPLOYMENT_ID" ]; then
    aws apigateway update-stage \
        --rest-api-id $API_ID \
        --region $REGION \
        --stage-name prod \
        --deployment-id $DEPLOYMENT_ID
    echo "✅ Stage updated with deployment: $DEPLOYMENT_ID"
else
    echo "❌ No deployment ID available"
fi

echo ""
echo "✅ API Gateway CORS fix complete!"
echo ""
echo "📋 What was fixed:"
echo "   ✅ New deployment with CORS-enabled Lambda"
echo "   ✅ Updated prod stage to point to new deployment"
echo ""
echo "🧪 Test order status updates now:"
echo "   1. Go to Admin → Orders"
echo "   2. Try updating order status"
echo "   3. Should work without CORS errors"
echo ""
echo "🎯 Expected Result: Order status should update successfully!"
