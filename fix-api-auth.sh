#!/bin/bash

echo "🔧 Fixing API Gateway Authorization..."
echo ""

REGION="us-east-1"
API_ID="rf07rrfyjb"
USER_POOL_ID="us-east-1_MqsmTDkkg"

# Get resource IDs
echo "📡 Getting API resources..."

ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[0].id' --output text)
echo "Root Resource: $ROOT_ID"

# Get admin resource
ADMIN_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/admin'].id" --output text)
echo "Admin Resource: $ADMIN_ID"

# Get users resource
USERS_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/admin/users'].id" --output text)
echo "Users Resource: $USERS_ID"

# Get user resource
USER_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/admin/users/{userId}'].id" --output text)
echo "User Resource: $USER_ID"

echo ""
echo "🔐 Updating methods to use COGNITO_USER_POOLS authorization..."

# Update GET /admin/users method
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $USERS_ID \
  --http-method GET \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=replace,path=/authorizerId,value="" \
    op=put,path=/requestParameters/method.request.header.Authorization,value=true \
  --region $REGION

echo "✅ GET /admin/users updated"

# Update POST /admin/users method
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $USERS_ID \
  --http-method POST \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=put,path=/requestParameters/method.request.header.Authorization,value=true \
  --region $REGION

echo "✅ POST /admin/users updated"

# Update GET /admin/users/{userId} method
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $USER_ID \
  --http-method GET \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=put,path=/requestParameters/method.request.header.Authorization,value=true \
  --region $REGION

echo "✅ GET /admin/users/{userId} updated"

# Update PUT /admin/users/{userId} method
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $USER_ID \
  --http-method PUT \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=put,path=/requestParameters/method.request.header.Authorization,value=true \
  --region $REGION

echo "✅ PUT /admin/users/{userId} updated"

# Update DELETE /admin/users/{userId} method
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $USER_ID \
  --http-method DELETE \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=put,path=/requestParameters/method.request.header.Authorization,value=true \
  --region $REGION

echo "✅ DELETE /admin/users/{userId} updated"

echo ""
echo "📦 Redeploying API..."

aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --stage-description "Production deployment with Cognito auth" \
  --region $REGION

echo "✅ API redeployed"

echo ""
echo "🔗 Creating Cognito Authorizer..."

# Create Cognito User Pools authorizer
aws apigateway create-authorizer \
  --rest-api-id $API_ID \
  --name cognito-authorizer \
  --type COGNITO_USER_POOLS \
  --provider-arns arn:aws:cognito-idp:$REGION:$(aws sts get-caller-identity --query Account --output text):userpool/$USER_POOL_ID \
  --identitySource method.request.header.Authorization \
  --region $REGION

echo "✅ Cognito Authorizer created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ API Gateway Authorization Configured!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 API Endpoint:"
echo "   https://$API_ID.execute-api.$REGION.amazonaws.com/prod/admin/users"
echo ""
echo "🔐 Test with:"
echo "   curl -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "     https://$API_ID.execute-api.$REGION.amazonaws.com/prod/admin/users"
echo ""
