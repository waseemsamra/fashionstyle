#!/bin/bash

# Fix Missing User Profiles in DynamoDB
# This script creates user profiles for existing Cognito users

echo "🔧 Fixing missing user profiles..."
echo ""

# User to fix
USER_EMAIL="waseem.samra@tcmiglobal.com"
USER_ID="waseem-samra"  # Sanitized version
TABLE_NAME="fashionstore-prod"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Creating profile for:"
echo "  Email: $USER_EMAIL"
echo "  User ID: $USER_ID"
echo "  Table: $TABLE_NAME"
echo ""

# Create the user profile in DynamoDB
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "PK": {"S": "USER#'"$USER_ID"'"},
    "SK": {"S": "PROFILE"},
    "profile": {
      "M": {
        "email": {"S": "'"$USER_EMAIL"'"},
        "firstName": {"S": ""},
        "lastName": {"S": ""},
        "contact": {"S": ""},
        "role": {"S": "customer"},
        "status": {"S": "active"}
      }
    },
    "createdAt": {"S": "'"$TIMESTAMP"'"},
    "updatedAt": {"S": "'"$TIMESTAMP"'"}
  }' \
  --region us-east-1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ User profile created successfully!"
  echo ""
  echo "To verify, run:"
  echo "  aws dynamodb get-item \\"
  echo "    --table-name $TABLE_NAME \\"
  echo "    --key '{\"PK\": {\"S\": \"USER#$USER_ID\"}, \"SK\": {\"S\": \"PROFILE\"}}' \\"
  echo "    --region us-east-1"
else
  echo "❌ Failed to create user profile"
  echo "Make sure AWS CLI is configured and you have permissions"
fi
