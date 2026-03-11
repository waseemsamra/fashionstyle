#!/bin/bash

# Deploy updated Orders Lambda with welcome email for guest users

set -e

REGION="us-east-1"
FUNCTION_NAME="fashionstore-prod-orders-lambda"

echo "🚀 Deploying updated Orders Lambda with welcome email..."

# Create deployment package
cd /Users/apple/Downloads/fashionstyle
zip -j lambda-orders-with-welcome-email.zip lambda-orders-final.js

# Update Lambda function
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-orders-with-welcome-email.zip \
    --region $REGION

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 What's new:"
echo "   ✅ Order confirmation email (existing)"
echo "   ✨ Welcome email with login credentials for guest users (NEW)"
echo ""
echo "🧪 Test guest checkout:"
echo "   1. Add items to cart"
echo "   2. Go to checkout"
echo "   3. Fill in guest details (new email)"
echo "   4. Place order"
echo "   5. Check email for:"
echo "      - Order confirmation"
echo "      - Welcome email with temp password"
echo ""

# Clean up
rm -f lambda-orders-with-welcome-email.zip

