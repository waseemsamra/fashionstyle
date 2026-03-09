#!/bin/bash

# Deploy List Users API Stack
echo "Deploying List Users API..."

aws cloudformation deploy \
  --template-file list-users-stack.yaml \
  --stack-name fashionstore-list-users \
  --parameter-overrides \
    RestApiId=8ur8l436ff \
    TableName=fashionstore-prod \
    Environment=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo "Deployment complete!"
echo ""
echo "API Endpoint: https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users"
echo ""
echo "Test with:"
echo "GET:  curl https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users"
