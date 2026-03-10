#!/bin/bash

# Deploy Orders Lambda with SES Email Support

echo "🚀 Deploying Orders Lambda with SES Email Support..."
echo ""

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

# Create deployment package
echo "📦 Creating deployment package..."
cd /Users/apple/Downloads/fashionstyle
zip -j lambda-orders-with-ses.zip lambda-orders-final.js

# Update Lambda function
echo "⬆️  Updating Lambda function..."
aws lambda update-function-code \
  --function-name fashionstore-prod-orders-v2 \
  --zip-file fileb://lambda-orders-with-ses.zip \
  --region us-east-1

# Add environment variable for SES email (using verified email)
echo "📧 Adding SES environment variable..."
aws lambda update-function-configuration \
  --function-name fashionstore-prod-orders-v2 \
  --environment Variables="{TABLE_NAME=fashionstore-prod,SES_FROM_EMAIL=waseemsamra@gmail.com}" \
  --region us-east-1

# Add SES permissions to Lambda role
echo "🔐 Adding SES permissions..."
aws iam attach-role-policy \
  --role-name fashionstore-lambda-role-prod \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess \
  --region us-east-1

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📧 SES Configuration:"
echo "   From Email: waseemsamra@gmail.com ✅ (Verified)"
echo "   Mode: Sandbox (for testing)"
echo ""
echo "🧪 Test:"
echo "   1. Place an order with waseemsamra@gmail.com"
echo "   2. Check inbox for order confirmation!"
echo ""
echo "⚠️  Note: In SES Sandbox, you can only send to verified emails"
echo "   To send to any email, request production access in SES Console"
