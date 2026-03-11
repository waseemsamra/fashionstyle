#!/bin/bash

# Deploy Orders Lambda with fixed CORS headers

set -e

REGION="us-east-1"
FUNCTION_NAME="fashionstore-prod-orders-lambda"

echo "🚀 Deploying Orders Lambda with CORS fix..."

# Create deployment package
cd /Users/apple/Downloads/fashionstyle
zip -j lambda-orders-fixed.zip lambda-orders-final.js

# Update Lambda function
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-orders-fixed.zip \
    --region $REGION

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 What's fixed:"
echo "   ✅ Added Authorization to CORS allowed headers"
echo "   ✅ Added PUT, DELETE to allowed methods"
echo "   ✅ Added Access-Control-Allow-Credentials"
echo "   ✅ Enhanced CORS preflight logging"
echo ""
echo "🧪 Test orders endpoint:"
echo "   1. Login to your account"
echo "   2. Go to Dashboard → Orders"
echo "   3. Check browser console for CORS errors"
echo ""

# Clean up
rm -f lambda-orders-fixed.zip

