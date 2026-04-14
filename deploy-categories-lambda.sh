#!/bin/bash
# Deploy categories Lambda function
# Run this from the project root directory

set -e

LAMBDA_NAME="fashionstore-categories"
REGION="us-east-1"

echo "🚀 Deploying $LAMBDA_NAME..."

# 1. Zip the Lambda code
echo "📦 Zipping Lambda code..."
zip -j /tmp/categories-lambda.zip lambda/categoriesHandler.js

# 2. Update Lambda code
echo "📤 Uploading to AWS Lambda..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb:///tmp/categories-lambda.zip \
  --region "$REGION"

echo "✅ Lambda code updated!"

# 3. Wait a few seconds for Lambda to update
echo "⏳ Waiting for Lambda to update..."
sleep 10

# 4. Test the endpoint
echo "🧪 Testing endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/categories")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Categories endpoint test passed (HTTP 200)"
else
  echo "⚠️  Categories endpoint returned HTTP $RESPONSE"
fi

# Cleanup
rm -f /tmp/categories-lambda.zip

echo "🎉 Deployment complete!"
