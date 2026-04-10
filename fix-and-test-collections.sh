#!/bin/bash
# fix-and-test-collections.sh
# Run this in your AWS shell to fix and test everything

set -e  # Stop on error

REGION="us-east-1"
LAMBDA_NAME="fashionstore-collections"
API_ID="rvtv0snm8k"
API_STAGE="prod"
ACCOUNT_ID="536217686312"
TABLE_NAME="fashionstore-data"

echo "=================================================="
echo "🔧 Fixing and Testing Collections Lambda"
echo "=================================================="
echo ""

# Step 1: Recreate zip
echo "Step 1: Recreating Lambda zip..."
cd lambda
rm -f collectionsHandler.zip
zip collectionsHandler.zip collectionsHandler.js
echo "✅ Zip created"
cd ..

# Step 2: Upload Lambda code
echo ""
echo "Step 2: Uploading Lambda code..."
aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://lambda/collectionsHandler.zip \
    --region "$REGION"

# Wait for Lambda to update
echo "Waiting for Lambda to update..."
sleep 5

# Step 3: Verify environment variables
echo ""
echo "Step 3: Checking environment variables..."
aws lambda update-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --environment "Variables={TABLE_NAME=$TABLE_NAME}" \
    --timeout 30 \
    --memory-size 256 \
    --region "$REGION"

echo "✅ Lambda updated"

# Step 4: Add IAM permissions
echo ""
echo "Step 4: Adding IAM permissions..."
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_NAME"

# Get role name from Lambda
ROLE_ARN=$(aws lambda get-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --region "$REGION" \
    --query 'Role' \
    --output text)
ROLE_NAME=$(echo "$ROLE_ARN" | cut -d'/' -f2)

# Add DynamoDB permissions
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "fashionstore-collections-dynamodb" \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:BatchGetItem",
                    "dynamodb:Query"
                ],
                "Resource": [
                    "arn:aws:dynamodb:'"$REGION"':'"$ACCOUNT_ID"':table/'"$TABLE_NAME"'",
                    "arn:aws:dynamodb:'"$REGION"':'"$ACCOUNT_ID"':table/'"$TABLE_NAME"'/index/*"
                ]
            }
        ]
    }'

echo "✅ IAM permissions added"

# Step 5: Deploy API Gateway
echo ""
echo "Step 5: Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$API_STAGE" \
    --region "$REGION"

echo "✅ API deployed"

# Step 6: Wait for deployment
echo ""
echo "Waiting for deployment to propagate..."
sleep 10

# Step 7: Test endpoints
echo ""
echo "=================================================="
echo "🧪 Testing Endpoints"
echo "=================================================="
echo ""

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$API_STAGE"

echo "Test 1: GET /collections"
echo "-------------------------------"
curl -s "$API_URL/collections" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/collections"
echo ""
echo ""

echo "Test 2: GET /collections/test (should return 404)"
echo "-------------------------------"
curl -s "$API_URL/collections/test" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/collections/test"
echo ""
echo ""

echo "Test 3: POST /collections/test"
echo "-------------------------------"
curl -s -X POST "$API_URL/collections/test" \
    -H "Content-Type: application/json" \
    -d '{"productIds":["prod-1","prod-2"],"displayName":"Test Collection"}' | python3 -m json.tool 2>/dev/null || \
curl -s -X POST "$API_URL/collections/test" \
    -H "Content-Type: application/json" \
    -d '{"productIds":["prod-1","prod-2"],"displayName":"Test Collection"}'
echo ""
echo ""

echo "Test 4: GET /collections/test (should now exist)"
echo "-------------------------------"
curl -s "$API_URL/collections/test" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/collections/test"
echo ""
echo ""

echo "=================================================="
echo "✅ Complete!"
echo "=================================================="
echo ""
echo "If you see JSON responses above, your API is working!"
echo "If you see errors, check CloudWatch logs:"
echo "  aws logs tail /aws/lambda/$LAMBDA_NAME --region $REGION --follow"
echo ""
