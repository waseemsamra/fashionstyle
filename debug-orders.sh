#!/bin/bash

# Debug script to check orders in DynamoDB

REGION="us-east-1"
TABLE_NAME="fashionstore-prod"

echo "🔍 Debugging Orders Issue"
echo "========================="
echo ""

# Get all orders from DynamoDB
echo "📋 Querying DynamoDB for all orders..."
aws dynamodb scan \
  --table-name "$TABLE_NAME" \
  --filter-expression "begins_with(SK, :skPrefix)" \
  --expression-attribute-values '{":skPrefix": {"S": "ORDER#"}}' \
  --region "$REGION" \
  --query 'Items[*].{PK:PK,SK:SK,orderId:orderId,totalPrice:totalPrice,date:date}' \
  --output table

echo ""
echo "If you see orders above, check if the PK (User ID) matches your logged-in user."
echo ""

# Test API with a specific user ID
echo "🧪 Testing API with TEST user..."
API_ID="8ur8l436ff"
curl -s -X GET "https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/users/TEST-USER-123/orders" | jq .

echo ""
echo "✅ Debug complete!"
