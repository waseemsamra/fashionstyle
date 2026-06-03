#!/bin/bash

# Deploy Fixed Products Update Lambda to Admin API

set -e

REGION="us-east-1"
FUNCTION_NAME="product-update-simple-v2"

echo "🚀 Deploying fixed Products Update Lambda to Admin API..."

cd /Users/apple/Downloads/fashionstyle
zip -j lambda-product-update-fixed.zip lambda-products-api.js

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-product-update-fixed.zip \
    --region $REGION

echo ""
echo "✅ Products Update Lambda deployed!"
echo "🧪 Test: curl -X PUT https://l7u50xa9j4.execute-api.us-east-1.amazonaws.com/prod/products/{product-id} -H 'Content-Type: application/json' -d '{\"isFeatured\":true}'"