# Deploy Vendor & Order Management Lambda

## What Needs Deployment

Two Lambda functions need to be created/updated:

### 1. Vendors Lambda (`vendorsHandler.js`)
Handles all vendor CRUD and order management

### 2. DynamoDB
Uses existing `fashionstore-data` table - no new collection needed!

---

## Option 1: AWS Console (Manual - Easiest)

### Step 1: Create Lambda Function

1. Go to **AWS Lambda Console**
2. Click **"Create function"**
3. Choose **"Author from scratch"**
4. Settings:
   - **Function name**: `fashionstore-universal-vendors`
   - **Runtime**: Node.js 18.x
   - **Architecture**: x86_64
5. Click **"Create function"**

### Step 2: Upload Code

1. In Lambda code editor, replace `index.js` with contents of `lambda/vendorsHandler.js`
2. Set **Environment Variables**:
   - `TABLE_NAME` = `fashionstore-data`
3. Click **"Deploy"**

### Step 3: Configure API Gateway

1. Go to **API Gateway Console**
2. Find your API: `fashionstore` (ID: `rvtv0snm8k`)
3. Add these routes:

| Resource | Method | Integration |
|----------|--------|-------------|
| `/admin/vendors` | GET | Lambda: `fashionstore-universal-vendors` |
| `/admin/vendors` | POST | Lambda: `fashionstore-universal-vendors` |
| `/admin/vendors/{id}` | GET | Lambda: `fashionstore-universal-vendors` |
| `/admin/vendors/{id}` | PATCH | Lambda: `fashionstore-universal-vendors` |
| `/admin/vendors/{id}` | DELETE | Lambda: `fashionstore-universal-vendors` |
| `/admin/vendors/{id}/orders` | GET | Lambda: `fashionstore-universal-vendors` |
| `/admin/orders/{orderId}/status` | PATCH | Lambda: `fashionstore-universal-vendors` |
| `/admin/inventory/low-stock` | GET | Lambda: `fashionstore-universal-vendors` |

4. **Deploy API** to `prod` stage
5. Enable **CORS** on all resources

### Step 4: Add Permissions

In Lambda → Configuration → Permissions:
- Add resource-based policy for API Gateway invoke
- Or run this AWS CLI command:

```bash
aws lambda add-permission \
  --function-name fashionstore-universal-vendors \
  --statement-id apigateway-vendors \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:YOUR_ACCOUNT_ID:rvtv0snm8k/*/*/*"
```

---

## Option 2: AWS CLI (Faster)

```bash
cd /Users/apple/Downloads/fashionstyle/lambda

# Install uuid dependency
npm install uuid

# Create zip
zip vendors-handler.zip vendorsHandler.js node_modules/uuid/dist/*

# Create Lambda
aws lambda create-function \
  --function-name fashionstore-universal-vendors \
  --runtime nodejs18.x \
  --role YOUR_LAMBDA_EXECUTION_ROLE_ARN \
  --handler vendorsHandler.handler \
  --zip-file fileb://vendors-handler.zip \
  --environment Variables="{TABLE_NAME=fashionstore-data}" \
  --region us-east-1

# Add API Gateway permission
aws lambda add-permission \
  --function-name fashionstore-universal-vendors \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:$(aws sts get-caller-identity --query Account --output text):rvtv0snm8k/*" \
  --region us-east-1
```

---

## Option 3: Node.js Script

```bash
cd lambda
npm install archiver @aws-sdk/client-lambda
node deploy-vendors-lambda.js
```

---

## Testing After Deployment

### Test 1: Create Vendor
```bash
curl -X POST "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/admin/vendors" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "email": "vendor@test.com",
    "brands": ["Test Brand"],
    "status": "active"
  }'
```

### Test 2: List Vendors
```bash
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/admin/vendors"
```

### Test 3: Update Order Status
```bash
curl -X PATCH "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/admin/orders/ORD-123/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "inventoryAction": "reserve"}'
```

---

## DynamoDB Schema

**No new table needed!** Uses existing `fashionstore-data` table.

Vendors stored as:
```
PK: VENDOR#{vendorId}
SK: VENDOR#{vendorId}
{
  entityType: 'VENDOR',
  id: 'VENDOR-12345678',
  name: 'Vendor Name',
  slug: 'vendor-name',
  email: 'vendor@example.com',
  brands: ['Brand1', 'Brand2'],
  status: 'active',
  metrics: { totalOrders: 0, ... },
  createdAt: '2026-04-08T...',
  updatedAt: '2026-04-08T...'
}
```

Orders enhanced with:
```
{
  entityType: 'ORDER',
  orderId: 'ORD-12345678',
  status: 'pending',
  inventoryReserved: false,
  inventoryDeducted: false,
  timeline: [
    { status: 'pending', timestamp: '...', note: '...' }
  ],
  ...existing fields
}
```
