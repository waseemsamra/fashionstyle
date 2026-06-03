#!/bin/bash

# Deploy Batch Endpoints to Admin API

set -e

REGION="us-east-1"
API_ID="l7u50xa9j4"  # Admin API ID

echo "🚀 Deploying batch endpoints to Admin API..."

# Create deployment packages
cd /Users/apple/Downloads/fashionstyle

# Deploy batch-featured
echo "📦 Deploying batch-featured..."
zip -j lambda-batch-featured.zip lambda-batch-featured.js
aws lambda create-function \
    --function-name fashionstore-batch-featured \
    --runtime nodejs18.x \
    --handler index.handler \
    --zip-file fileb://lambda-batch-featured.zip \
    --role arn:aws:iam::$(aws sts get-caller-identity --query AccountId --output text):role/fashionstore-lambda-role-prod \
    --environment Variables="{PRODUCTS_TABLE=fashionstore-products-prod}" \
    --region $REGION || \
aws lambda update-function-code \
    --function-name fashionstore-batch-featured \
    --zip-file fileb://lambda-batch-featured.zip \
    --region $REGION

# Deploy batch-wedding
echo "📦 Deploying batch-wedding..."
zip -j lambda-batch-wedding.zip lambda-batch-wedding.js
aws lambda create-function \
    --function-name fashionstore-batch-wedding \
    --runtime nodejs18.x \
    --handler index.handler \
    --zip-file fileb://lambda-batch-wedding.zip \
    --role arn:aws:iam::$(aws sts get-caller-identity --query AccountId --output text):role/fashionstore-lambda-role-prod \
    --environment Variables="{PRODUCTS_TABLE=fashionstore-products-prod}" \
    --region $REGION || \
aws lambda update-function-code \
    --function-name fashionstore-batch-wedding \
    --zip-file fileb://lambda-batch-wedding.zip \
    --region $REGION

# Deploy batch-designers
echo "📦 Deploying batch-designers..."
zip -j lambda-batch-designers.zip lambda-batch-designers.js
aws lambda create-function \
    --function-name fashionstore-batch-designers \
    --runtime nodejs18.x \
    --handler index.handler \
    --zip-file fileb://lambda-batch-designers.zip \
    --role arn:aws:iam::$(aws sts get-caller-identity --query AccountId --output text):role/fashionstore-lambda-role-prod \
    --environment Variables="{PRODUCTS_TABLE=fashionstore-products-prod}" \
    --region $REGION || \
aws lambda update-function-code \
    --function-name fashionstore-batch-designers \
    --zip-file fileb://lambda-batch-designers.zip \
    --region $REGION

echo ""
echo "✅ All batch endpoints deployed!"
echo "⚠️  Note: You need to add API Gateway routes manually in AWS Console or update the CloudFormation template"