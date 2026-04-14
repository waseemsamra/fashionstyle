#!/bin/bash
# Deploy products Lambda function with CORS fix
# Run this from the project root directory

set -e

LAMBDA_NAME="fashionstore-products-prod"
REGION="us-east-1"

echo "🚀 Deploying $LAMBDA_NAME..."

# 1. Zip the Lambda code
echo "📦 Zipping Lambda code..."
zip -j /tmp/products-lambda.zip lambda/productsHandler.js

# 2. Update Lambda code
echo "📤 Uploading to AWS Lambda..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb:///tmp/products-lambda.zip \
  --region "$REGION"

echo "✅ Lambda code updated!"

# 3. Wait a few seconds for Lambda to update
echo "⏳ Waiting for Lambda to update..."
sleep 10

# 4. Test the CORS headers
echo "🧪 Testing CORS..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/products?limit=1")

if [ "$RESPONSE" = "200" ]; then
  echo "✅ CORS preflight test passed (HTTP 200)"
else
  echo "⚠️  CORS preflight returned HTTP $RESPONSE"
  echo "   You may need to enable CORS in API Gateway console:"
  echo "   1. Go to API Gateway → $LAMBDA_NAME → Resources"
  echo "   2. Select /{proxy+} or /products"
  echo "   3. Actions → Enable CORS"
  echo "   4. Actions → Deploy API → prod"
fi

# Cleanup
rm -f /tmp/products-lambda.zip

echo "🎉 Deployment complete!"
