#!/bin/bash
# test-collections-api.sh
# Quick test script to verify collections API

echo "🧪 Testing Collections API..."
echo ""

API_URL="https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod"

echo "1️⃣  Testing GET /collections..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/collections")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "   Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ GET /collections works!"
elif [ "$HTTP_CODE" == "502" ] || [ "$HTTP_CODE" == "500" ]; then
    echo "❌ Server error - Check Lambda logs:"
    echo "   aws logs tail /aws/lambda/fashionstore-collections --region us-east-1 --follow"
    echo ""
    echo "💡 Common issues:"
    echo "   - Lambda code not uploaded correctly"
    echo "   - Missing environment variables"
    echo "   - IAM permissions issue"
fi

echo ""
echo "2️⃣  Testing GET /collections/test..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/collections/test")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "   Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

echo "3️⃣  Testing POST /collections/test..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$API_URL/collections/test" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["prod-1","prod-2"],"displayName":"Test Collection"}')
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "   Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

echo "✅ Tests complete!"
