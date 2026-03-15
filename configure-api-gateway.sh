#!/bin/bash

# API Gateway Configuration Script for Settings API
# This script configures all endpoints for the Settings Lambda

set -e

# Configuration
API_ID="xpyh8srop0"
REGION="us-east-1"
LAMBDA_FUNCTION="fashionstore-prod-settings-complete"
LAMBDA_ARN="arn:aws:lambda:${REGION}:YOUR_ACCOUNT_ID:function:${LAMBDA_FUNCTION}"

echo "🚀 Configuring API Gateway for Settings API..."
echo "📋 API ID: ${API_ID}"
echo "📍 Region: ${REGION}"
echo "🔧 Lambda: ${LAMBDA_FUNCTION}"

# Create parent resource: /admin
echo "📁 Creating /admin resource..."
ADMIN_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id ${API_ID} \
  --parent-id $(aws apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/`].id' --output text) \
  --path-part admin \
  --query 'id' \
  --output text)

# Create resource: /admin/settings-v2
echo "📁 Creating /admin/settings-v2 resource..."
SETTINGS_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id ${API_ID} \
  --parent-id ${ADMIN_RESOURCE_ID} \
  --path-part settings-v2 \
  --query 'id' \
  --output text)

# Create proxy resource: /admin/settings-v2/{section+}
echo "📁 Creating /admin/settings-v2/{section+} proxy resource..."
SECTION_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id ${API_ID} \
  --parent-id ${SETTINGS_RESOURCE_ID} \
  --path-part '{section+}' \
  --query 'id' \
  --output text)

# Enable CORS for section resource
echo "🔓 Enabling CORS for section resource..."
aws apigateway put-method-response \
  --rest-api-id ${API_ID} \
  --resource-id ${SECTION_RESOURCE_ID} \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "method.response.header.Access-Control-Allow-Origin=true" \
  --region ${REGION} || true

aws apigateway put-integration-response \
  --rest-api-id ${API_ID} \
  --resource-id ${SECTION_RESOURCE_ID} \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "method.response.header.Access-Control-Allow-Origin='*'" \
  --region ${REGION} || true

# Create methods for section resource (GET, POST, PUT, DELETE, PATCH)
for METHOD in GET POST PUT DELETE PATCH; do
  echo "🔧 Creating ${METHOD} method..."
  
  aws apigateway put-method \
    --rest-api-id ${API_ID} \
    --resource-id ${SECTION_RESOURCE_ID} \
    --http-method ${METHOD} \
    --authorization-type NONE \
    --api-key-required false \
    --region ${REGION}
  
  aws apigateway put-integration \
    --rest-api-id ${API_ID} \
    --resource-id ${SECTION_RESOURCE_ID} \
    --http-method ${METHOD} \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations \
    --region ${REGION}
  
  aws apigateway put-method-response \
    --rest-api-id ${API_ID} \
    --resource-id ${SECTION_RESOURCE_ID} \
    --http-method ${METHOD} \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin=true" \
    --region ${REGION}
  
  aws apigateway put-integration-response \
    --rest-api-id ${API_ID} \
    --resource-id ${SECTION_RESOURCE_ID} \
    --http-method ${METHOD} \
    --status-code 200 \
    --response-parameters "method.response.header.Access-Control-Allow-Origin='*'" \
    --region ${REGION}
done

# Add Lambda permissions
echo "🔐 Adding Lambda permissions..."
aws lambda add-permission \
  --function-name ${LAMBDA_FUNCTION} \
  --statement-id apigateway-settings-${SECTION_RESOURCE_ID} \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:YOUR_ACCOUNT_ID:${API_ID}/*/*/*" \
  --region ${REGION} || true

# Deploy API
echo "🚀 Deploying API..."
aws apigateway create-deployment \
  --rest-api-id ${API_ID} \
  --stage-name prod \
  --stage-config "variables={environment=production}" \
  --region ${REGION}

echo ""
echo "✅ API Gateway Configuration Complete!"
echo ""
echo "📋 Available Endpoints:"
echo "   GET    https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/admin/settings-v2/:section"
echo "   POST   https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/admin/settings-v2/:section"
echo "   PUT    https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/admin/settings-v2/:section/:id"
echo "   DELETE https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/admin/settings-v2/:section/:id"
echo "   PATCH  https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/admin/settings-v2/:section/reorder"
echo ""
echo "📋 Supported Sections:"
echo "   - categories"
echo "   - store"
echo "   - colors"
echo "   - materials"
echo "   - sizes"
echo "   - patterns"
echo "   - occasions"
echo "   - genders"
echo "   - general"
echo ""
echo "🧪 Test with curl:"
echo "   curl -X GET https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/admin/settings-v2/categories"
echo ""
