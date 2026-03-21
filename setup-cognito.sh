#!/bin/bash

echo "🔐 Setting up Cognito User Pool..."
echo ""

REGION="us-east-1"

# Step 1: Create User Pool
echo "1️⃣ Creating Cognito User Pool..."

USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name fashionstore-user-pool \
  --region $REGION \
  --username-attributes email \
  --auto-verified-attributes email \
  --policies '{"PasswordPolicy": {"MinimumLength": 8, "RequireUppercase": true, "RequireLowercase": true, "RequireNumbers": true, "RequireSymbols": true}}' \
  --mfa-configuration OFF \
  --query 'UserPool.Id' \
  --output text)

echo "✅ User Pool Created: $USER_POOL_ID"
echo ""

# Step 2: Create User Pool Client
echo "2️⃣ Creating User Pool Client..."

USER_POOL_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name fashionstore-web-client \
  --region $REGION \
  --generate-secret false \
  --allowed-o-auth-flows-user-pool-client \
  --allowed-o-auth-flows code,implicit \
  --allowed-o-auth-scopes openid,email,profile \
  --supported-identity-providers COGNITO \
  --callback-urls "http://localhost:5173/auth/callback" \
  --logout-urls "http://localhost:5173/" \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "✅ User Pool Client Created: $USER_POOL_CLIENT_ID"
echo ""

# Step 3: Create Admin User
echo "3️⃣ Creating Admin User..."

aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username waseemsamra@gmail.com \
  --user-attributes Name=email,Value=waseemsamra@gmail.com Name=email_verified,Value=true \
  --temporary-password "Admin@123" \
  --message-action SUPPRESS \
  --region $REGION

echo "✅ Admin User Created"
echo ""

# Step 4: Set Permanent Password
echo "4️⃣ Setting Permanent Password..."

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username waseemsamra@gmail.com \
  --password "Admin@123" \
  --permanent \
  --region $REGION

echo "✅ Password Set"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Cognito Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Configuration:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   Client ID: $USER_POOL_CLIENT_ID"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: waseemsamra@gmail.com"
echo "   Password: Admin@123"
echo ""
