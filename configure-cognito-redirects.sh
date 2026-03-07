#!/bin/bash

# Configure Cognito OAuth Redirects for Amplify
# This script adds your Amplify domain to Cognito redirect URLs

USER_POOL_ID="us-east-1_MjEc3MXcK"
CLIENT_ID="1ijahndnp57usbb131kpbchnkf"
AMPLIFY_DOMAIN="https://main.d1l8ayoz0simv1.amplifyapp.com/"
LOCALHOST="http://localhost:3001/"

echo "🔧 Configuring Cognito OAuth Redirects"
echo "======================================="
echo ""
echo "User Pool: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Amplify Domain: $AMPLIFY_DOMAIN"
echo "Localhost: $LOCALHOST"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed."
    echo "Please install it: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo ""
    echo "Or configure manually:"
    echo "1. Go to: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1"
    echo "2. Click 'User pools' → '$USER_POOL_ID'"
    echo "3. Click 'App integration' → Edit Hosted UI"
    echo "4. Add redirect URIs:"
    echo "   - $AMPLIFY_DOMAIN"
    echo "   - $LOCALHOST"
    echo "5. Click 'Save changes'"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""
echo "📝 Updating Cognito user pool client..."
echo ""

# Get current callback URLs
CURRENT_CALLBACKS=$(aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID \
  --query 'UserPoolClient.CallbackURLs' \
  --output json \
  --region us-east-1 2>/dev/null)

echo "Current callback URLs: $CURRENT_CALLBACKS"
echo ""

# Update with new URLs
aws cognito-idp update-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID \
  --callback-urls "$AMPLIFY_DOMAIN" "$LOCALHOST" \
  --logout-urls "$AMPLIFY_DOMAIN" "$LOCALHOST" \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes openid email profile \
  --allowed-o-auth-flows-user-pool-client \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Cognito OAuth redirects configured successfully!"
    echo ""
    echo "📋 Updated redirect URLs:"
    echo "   Sign-in: $AMPLIFY_DOMAIN"
    echo "   Sign-out: $AMPLIFY_DOMAIN"
    echo "   Localhost: $LOCALHOST"
    echo ""
    echo "🌐 Your Amplify app:"
    echo "   https://main.d1l8ayoz0simv1.amplifyapp.com"
    echo ""
    echo "⏱️  Changes may take 1-2 minutes to propagate."
    echo ""
else
    echo ""
    echo "❌ Failed to update Cognito redirects."
    echo ""
    echo "Manual setup:"
    echo "1. Go to: https://us-east-1.console.aws.amazon.com/cognito/v2/home?region=us-east-1"
    echo "2. Click 'User pools' → '$USER_POOL_ID'"
    echo "3. Click 'App integration'"
    echo "4. Click 'Edit' under Hosted UI"
    echo "5. Add these redirect URIs:"
    echo "   - $AMPLIFY_DOMAIN"
    echo "   - $LOCALHOST"
    echo "6. Click 'Save changes'"
    exit 1
fi
