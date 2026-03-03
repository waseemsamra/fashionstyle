#!/bin/bash

# Create Admin Group and User in Cognito
# User: waseemsamra@gmail.com

echo "🔧 Setting up Admin access..."
echo ""

# Step 1: Create Admin Group
echo "1️⃣ Creating 'Admins' group..."
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id us-east-1_qavi3JAVz \
  --description "Administrator group with full access" \
  --region us-east-1

echo "✅ Admin group created"
echo ""

# Step 2: Create Admin User
echo "2️⃣ Creating admin user..."
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --user-attributes Name=email,Value=waseemsamra@gmail.com Name=email_verified,Value=true \
  --temporary-password "Admin@123" \
  --message-action SUPPRESS \
  --region us-east-1

echo "✅ Admin user created"
echo ""

# Step 3: Add User to Admin Group
echo "3️⃣ Adding user to Admins group..."
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --group-name Admins \
  --region us-east-1

echo "✅ User added to Admins group"
echo ""
echo "🎉 Admin setup complete!"
echo ""
echo "📧 Email: waseemsamra@gmail.com"
echo "🔑 Temporary Password: Admin@123"
echo "👥 Group: Admins"
echo ""
echo "⚠️  You will be prompted to change password on first login"
echo ""
echo "To set permanent password, run:"
echo "aws cognito-idp admin-set-user-password \\"
echo "  --user-pool-id us-east-1_qavi3JAVz \\"
echo "  --username waseemsamra@gmail.com \\"
echo "  --password 'YourNewPassword123!' \\"
echo "  --permanent \\"
echo "  --region us-east-1"
