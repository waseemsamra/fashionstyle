#!/bin/bash

# Deploy fixed code to fashionstore-products-crud-api

set -e

REGION="us-east-1"
FUNCTION_NAME="fashionstore-products-crud-api"

echo "🚀 Deploying to $FUNCTION_NAME..."

cd /Users/apple/Downloads/fashionstyle
zip -j lambda-crud-api.zip lambda-products-fixed.py

aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-crud-api.zip \
    --region $REGION

echo "✅ Deployed!"