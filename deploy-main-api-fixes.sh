#!/bin/bash

echo "🚀 Deploying Main API with missing endpoints fixes..."

# Configuration
REGION="us-east-1"
FUNCTION_NAME="fashionstore-api"
ROLE_NAME="lambda-dynamo-role"

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
cd lambda
zip -r ../main-api-update.zip unifiedHandler.js node_modules/
cd ..

# Step 2: Update Lambda function
echo "🔄 Updating Lambda function..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://main-api-update.zip \
  --region $REGION

echo "✅ Main API updated with missing endpoints:"
echo "   - /users/{userId}/orders - User orders endpoint"
echo "   - /products/{productId}/reviews - Product reviews endpoint"
echo "   - Enhanced CORS headers"
echo "   - Proper error handling"

# Clean up
rm main-api-update.zip

echo "🎉 Deployment complete!"
