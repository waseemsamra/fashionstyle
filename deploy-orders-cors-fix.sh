#!/bin/bash

# Deploy Orders Lambda with CORS fix for Amplify compatibility

set -e

REGION="us-east-1"
FUNCTION_NAME="fashionstore-orders-prod"

echo "🚀 Deploying Orders Lambda with CORS fix for Amplify..."

# Create deployment package
cd /Users/apple/Downloads/fashionstyle
zip -j lambda-orders-cors-fixed.zip lambda-orders-cors-fixed.js

# Update Lambda function
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-orders-cors-fixed.zip \
    --region $REGION

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 CORS Fix Applied:"
echo "   ✅ Added Access-Control-Allow-Origin: * (for Amplify)"
echo "   ✅ Added Authorization to allowed headers"
echo "   ✅ Added PUT, DELETE to allowed methods"
echo "   ✅ Added Access-Control-Allow-Credentials: true"
echo "   ✅ Enhanced preflight OPTIONS handling"
echo ""
echo "🧪 Test order status updates now:"
echo "   1. Go to Admin → Orders"
echo "   2. Try updating order status"
echo "   3. Check browser console for CORS errors"
echo ""
echo "🎯 Expected Result: Order status should update successfully!"

# Clean up
rm -f lambda-orders-cors-fixed.zip
