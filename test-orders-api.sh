#!/bin/bash

# Test Orders API
# Run this after deploying the Lambda function

API_URL="https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod"
USER_ID="TEST-USER-123"

echo "🧪 Testing Orders API..."
echo ""

# Test 1: Create Order
echo "📝 Test 1: Creating order..."
CREATE_RESPONSE=$(curl -s -X POST \
  "${API_URL}/users/${USER_ID}/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-TEST-'$(date +%s)'",
    "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "items": [
      {
        "id": 1,
        "name": "Test Product",
        "price": 99.99,
        "quantity": 1
      }
    ],
    "totalPrice": 99.99,
    "paymentMethod": "card",
    "status": "Processing",
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "postalCode": "12345",
    "itemCount": 1
  }')

echo "Response: $CREATE_RESPONSE"
echo ""

# Extract Order ID
ORDER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
  echo "✅ Order created successfully: $ORDER_ID"
  echo ""
  
  # Test 2: Get Orders
  echo "📋 Test 2: Getting user orders..."
  GET_RESPONSE=$(curl -s "${API_URL}/users/${USER_ID}/orders")
  echo "Response: $GET_RESPONSE"
  echo ""
  
  if echo "$GET_RESPONSE" | grep -q "$ORDER_ID"; then
    echo "✅ Orders retrieved successfully!"
  else
    echo "⚠️ Order not found in list"
  fi
else
  echo "❌ Failed to create order"
  echo "Check Lambda logs in CloudWatch"
fi

echo ""
echo "🎉 Test complete!"
