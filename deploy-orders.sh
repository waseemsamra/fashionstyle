#!/bin/bash

# Deploy Orders API Stack
echo "Deploying Orders API..."

aws cloudformation deploy \
  --template-file orders-stack.yaml \
  --stack-name fashionstore-orders \
  --parameter-overrides \
    RestApiId=8ur8l436ff \
    TableName=fashionstore-prod \
    Environment=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo "Deployment complete!"
echo ""
echo "API Endpoints:"
echo "  GET/POST: https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/orders"
echo "  GET:      https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/{userId}/orders"
echo ""
echo "Test with:"
echo "GET:  curl https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID/orders"
echo "POST: curl -X POST https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID/orders -H 'Content-Type: application/json' -d '{\"orderId\":\"ORD-123\",\"items\":[],\"totalPrice\":99.99}'"
