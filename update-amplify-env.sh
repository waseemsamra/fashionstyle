#!/bin/bash

# AWS Amplify Deployment Configuration
APP_ID="d1l8ayoz0simv1"
BRANCH="main"

echo "🔧 Updating Amplify environment variables..."

# Get your Amplify domain from console
AMPLIFY_DOMAIN="main.d1l8ayoz0simv1.amplifyapp.com"

aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables \
    VITE_API_URL=https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod \
    VITE_GRAPHQL_URL=https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql \
    VITE_GRAPHQL_API_KEY=da2-aadwbwrozrfgriafn6pgjjhrca \
    VITE_USER_POOL_ID=us-east-1_MjEc3MXcK \
    VITE_USER_POOL_CLIENT_ID=1ijahndnp57usbb131kpbchnkf \
    VITE_IDENTITY_POOL_ID=us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927 \
    VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com \
    VITE_OAUTH_REDIRECT_SIGN_IN=https://$AMPLIFY_DOMAIN/ \
    VITE_OAUTH_REDIRECT_SIGN_OUT=https://$AMPLIFY_DOMAIN/ \
    VITE_S3_BUCKET=fashionstore-prod-assets-536217686312 \
    VITE_S3_URL=https://fashionstore-prod-assets-536217686312.s3.amazonaws.com \
    VITE_S3_BASE_URL=https://fashionstore-prod-assets-536217686312.s3.us-east-1.amazonaws.com \
    VITE_AWS_REGION=us-east-1 \
  --region us-east-1

echo "✅ Environment variables updated!"
echo ""
echo "🚀 Triggering new build..."

aws amplify start-job \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --job-type RELEASE \
  --region us-east-1

echo "✅ Build triggered!"
echo ""
echo "📱 Check your Amplify console:"
echo "https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/$APP_ID/branches/$BRANCH/deployments"
