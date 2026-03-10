#!/bin/bash

# Deploy Orders Lambda with Admin Orders Endpoint

echo "🚀 Deploying Orders Lambda with Admin Orders Endpoint..."
echo ""

cd /Users/apple/Downloads/fashionstyle

# Create deployment package
echo "📦 Creating deployment package..."
zip -j lambda-orders-with-admin.zip lambda-orders-final.js

# Update Lambda function
echo "⬆️  Updating Lambda function..."
aws lambda update-function-code \
  --function-name fashionstore-prod-orders-v2 \
  --zip-file fileb://lambda-orders-with-admin.zip \
  --region us-east-1

echo ""
echo "✅ Lambda updated!"
echo ""
echo "📋 NOW ADD API GATEWAY ENDPOINT MANUALLY:"
echo ""
echo "1. Go to API Gateway Console"
echo "2. Open API: xpyh8srop0"
echo "3. Click Resources"
echo "4. Click /admin resource (or create it if missing)"
echo "5. Create Resource: orders"
echo "6. Create Method: GET"
echo "7. Integration: Lambda Proxy"
echo "8. Lambda: fashionstore-prod-orders-v2"
echo "9. Deploy API to prod stage"
echo ""
echo "🧪 Test:"
echo "   curl https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/orders"
