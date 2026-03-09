#!/bin/bash

# Deploy Fashion Store Stack
echo "🚀 Deploying Fashion Store Stack..."
echo ""

aws cloudformation deploy \
  --template-file fashion-store-stack.yaml \
  --stack-name fashion-store \
  --parameter-overrides \
    Environment=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment complete!"
  echo ""
  echo "Getting API Gateway URL..."
  
  API_URL=$(aws cloudformation describe-stacks \
    --stack-name fashion-store \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text \
    --region us-east-1)
  
  echo ""
  echo "📍 API Gateway URL: $API_URL"
  echo ""
  echo "🧪 Test the users endpoint:"
  echo "   curl $API_URL/users"
  echo ""
  echo "📍 Lambda function name: fashionstore-prod-get-users-prod"
  echo ""
else
  echo "❌ Deployment failed!"
fi
