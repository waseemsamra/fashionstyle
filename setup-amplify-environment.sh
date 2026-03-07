#!/bin/bash

# AWS Amplify Environment Setup Script
# This script configures all environment variables for your Amplify app

APP_ID="d1l8ayoz0simv1"
BRANCH="main"
AMPLIFY_DOMAIN="main.d1l8ayoz0simv1.amplifyapp.com"

echo "🚀 AWS Amplify Environment Setup"
echo "================================"
echo ""
echo "App ID: $APP_ID"
echo "Branch: $BRANCH"
echo "Domain: $AMPLIFY_DOMAIN"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""
echo "📝 Setting up environment variables..."
echo ""

# Update Amplify app with environment variables
aws amplify update-app \
  --app-id $APP_ID \
  --region us-east-1 \
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
    VITE_AWS_REGION=us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Environment variables updated successfully!"
    echo ""
    echo "🚀 Triggering new deployment..."
    
    aws amplify start-job \
      --app-id $APP_ID \
      --branch-name $BRANCH \
      --job-type RELEASE \
      --region us-east-1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment started!"
        echo ""
        echo "📱 Monitor your deployment:"
        echo "https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/$APP_ID/branches/$BRANCH/deployments"
        echo ""
        echo "🌐 Your app will be available at:"
        echo "https://$AMPLIFY_DOMAIN"
        echo ""
        echo "⚠️  IMPORTANT: Before testing, make sure to:"
        echo "   1. Enable CORS on API Gateway (see AMPLIFY_ENVIRONMENT_COMPLETE.md)"
        echo "   2. Update Cognito OAuth redirect URLs"
        echo "   3. Wait for deployment to complete (~5 minutes)"
        echo ""
    else
        echo "❌ Failed to start deployment. Check AWS Console for details."
        exit 1
    fi
else
    echo "❌ Failed to update environment variables."
    echo ""
    echo "Manual setup required:"
    echo "1. Go to: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/apps/$APP_ID"
    echo "2. Click 'App settings' → 'Environment variables'"
    echo "3. Add all variables from AMPLIFY_ENVIRONMENT_COMPLETE.md"
    exit 1
fi
