#!/bin/bash

# Deploy User Profile API Stack
echo "Deploying User Profile API..."

aws cloudformation deploy \
  --template-file user-profile-stack.yaml \
  --stack-name fashionstore-user-profile \
  --parameter-overrides \
    RestApiId=8ur8l436ff \
    TableName=fashionstore-prod \
    Environment=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo "Deployment complete!"
echo ""
echo "API Endpoint: https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/{userId}/profile"
echo ""
echo "Test with:"
echo "GET:  curl https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID/profile"
echo "PUT:  curl -X PUT https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID/profile -d '{\"firstName\":\"John\",\"lastName\":\"Doe\"}'"
