#!/bin/bash

# Deploy Products Update Lambda to Admin API Gateway

set -e

REGION="us-east-1"
API_ID="l7u50xa9j4"
FUNCTION_NAME="fashionstore-products-update"
LAMBDA_FILE="lambda-products-update.js"

echo "🚀 Deploying Products Update Lambda..."

# Create deployment package
cd /Users/apple/Downloads/fashionstyle
zip lambda-products-update.zip $LAMBDA_FILE

# Create or update Lambda function
echo "📦 Updating Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --handler index.handler \
    --zip-file fileb://lambda-products-update.zip \
    --role arn:aws:iam::$(aws sts get-caller-identity --query AccountId --output text):role/fashionstore-lambda-role-prod \
    --environment Variables="{PRODUCTS_TABLE=fashionstore-products-prod}" \
    --region $REGION || \
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-products-update.zip \
    --region $REGION

echo "🔗 Adding Lambda permission for API Gateway..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke-permission \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:$(aws sts get-caller-identity --query AccountId --output text):${API_ID}/*/*" \
    --region $REGION || true

echo ""
echo "✅ Lambda deployed!"
echo ""
echo "⚠️  You must manually add the API Gateway resource in AWS Console:"
echo "   Resource: /products/{id}"
echo "   Method: PUT"
echo "   Integration: Lambda proxy to $FUNCTION_NAME"
echo ""
echo "   Also add OPTIONS method for CORS:"
echo "   Method: OPTIONS"
echo "   Integration: MOCK with CORS headers"