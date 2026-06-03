#!/bin/bash

# Deploy Updated Products API Lambda (with PUT/DELETE support)

set -e

REGION="us-east-1"
FUNCTION_NAME="fashionstore-products-api"
LAMBDA_FILE="lambda-products-api.js"

echo "🚀 Deploying Products API Lambda with PUT/DELETE support..."

cd /Users/apple/Downloads/fashionstyle
zip lambda-products-api.zip $LAMBDA_FILE

# Update Lambda function code
echo "📦 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-products-api.zip \
    --region $REGION

echo ""
echo "✅ Products API Lambda updated!"
echo "🔗 Function URL: https://iq4nnt33mzayreobcmb5vigivu0dufcl.lambda-url.us-east-1.on.aws/"
echo ""
echo "🧪 Test PUT endpoint:"
echo "   curl -X PUT https://ckj2m3ffztqonucij3mlh7s4mu0qafmg.lambda-url.us-east-1.on.aws/products/{product-id} \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"isFeatured\": true}'"