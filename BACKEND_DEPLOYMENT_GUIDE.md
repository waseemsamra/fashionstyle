# Backend Deployment Guide - Collections System

## What You Need to Deploy

You have **ONE new Lambda function** that needs to be deployed to AWS:

### 1. Deploy `collectionsHandler.js` to AWS Lambda

#### **Option A: Via AWS Console (Easiest)**

1. **Go to AWS Lambda Console**
   ```
   https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1
   ```

2. **Create New Function**
   - Click "Create function"
   - Function name: `fashionstore-collections` (or your naming pattern)
   - Runtime: Node.js 18.x or 20.x
   - Architecture: x86_64
   - Click "Create function"

3. **Upload Code**
   - Go to "Code" tab
   - Click "Upload from" → ".zip file"
   - Zip the file first:
     ```bash
     cd /Users/apple/Downloads/fashionstyle/lambda
     zip collectionsHandler.zip collectionsHandler.js
     ```
   - Upload `collectionsHandler.zip`

4. **Set Environment Variables**
   - Go to "Configuration" → "Environment variables"
   - Add:
     ```
     TABLE_NAME = fashionstore-data
     ```
   - Click "Save"

5. **Set Permissions**
   - Go to "Configuration" → "Permissions"
   - Click the Execution Role link
   - Click "Attach policies" or add inline policy:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "dynamodb:GetItem",
             "dynamodb:PutItem",
             "dynamodb:DeleteItem",
             "dynamodb:Scan",
             "dynamodb:BatchGetItem"
           ],
           "Resource": "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/fashionstore-data"
         }
       ]
     }
     ```
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID

6. **Configure Timeout & Memory**
   - Go to "Configuration" → "General configuration"
   - Memory: 256 MB
   - Timeout: 30 seconds
   - Click "Save"

---

### 2. Connect to API Gateway

#### **If you already have an API Gateway:**

1. **Go to API Gateway Console**
   ```
   https://us-east-1.console.aws.amazon.com/apigateway/home?region=us-east-1
   ```

2. **Select Your Existing API** (the one that handles `/products`)

3. **Add New Resources**
   - Click "Resources"
   - Create resource: `/collections`
   - Under `/collections`, create: `/{name}`

4. **Add Methods to `/collections`**
   - Click "Actions" → "Create Method" → GET
   - Integration type: Lambda Function
   - Select: `fashionstore-collections`
   - Click "Save"

5. **Add Methods to `/collections/{name}`**
   - Create GET method → Lambda: `fashionstore-collections`
   - Create POST method → Lambda: `fashionstore-collections`
   - Create DELETE method → Lambda: `fashionstore-collections`

6. **Enable CORS**
   - Click "Actions" → "Enable CORS"
   - Allow headers: `Content-Type,Authorization`
   - Allow methods: `GET,POST,DELETE,OPTIONS`
   - Click "Save"

7. **Deploy API**
   - Click "Actions" → "Deploy API"
   - Select stage: `prod` (or create new)
   - Click "Deploy"

8. **Note Your API URL**
   - Should be like: `https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod`
   - Collections endpoint: `https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections`

---

#### **Option B: Using AWS CLI (Faster if you have CLI set up)**

```bash
# 1. Create Lambda function
aws lambda create-function \
  --function-name fashionstore-collections \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE \
  --handler collectionsHandler.handler \
  --zip-file fileb://lambda/collectionsHandler.zip \
  --environment Variables="{TABLE_NAME=fashionstore-data}" \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-1

# 2. Add API Gateway integration (if you have API Gateway set up)
# This depends on your existing API Gateway setup
```

---

## What About DynamoDB Table?

**GOOD NEWS:** You **DON'T need a new table!**

Collections use the **SAME table** as products (`fashionstore-data`).

```
Table: fashionstore-data (ALREADY EXISTS)

Products:
- PK: PROD#123
- PK: PROD#456

Collections (NEW):
- PK: COLLECTION#featuredCollection
- PK: COLLECTION#designersDiscount
- PK: COLLECTION#weddingTales
```

They coexist peacefully because they have different `entityType` values.

**NO table creation needed!** ✅

---

## Testing After Deployment

### 1. Test Lambda Directly

```bash
# Test GET collection
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections/featuredCollection"

# Expected response (if collection exists):
{
  "collection": { ... },
  "products": [...],
  "count": 8
}

# Expected response (if collection doesn't exist yet):
{
  "message": "Collection not found",
  "collection": "featuredCollection",
  "products": []
}
```

### 2. Test Save Collection

```bash
# Test POST collection
curl -X POST "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections/testCollection" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["prod-1", "prod-2"],
    "displayName": "Test Collection"
  }'

# Expected response:
{
  "message": "Collection created",
  "collection": { ... },
  "productCount": 2
}
```

### 3. Test Home Page

1. Open browser
2. Go to home page
3. Open browser console (F12)
4. Should see:
   ```
   📦 Fetching collection: featuredCollection...
   ✅ Collection featuredCollection loaded: 8 products
   ```
5. Load time should be 50-100ms

---

## Current Backend Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| `lambda/collectionsHandler.js` | ✅ Created locally | **DEPLOY to AWS Lambda** |
| DynamoDB table | ✅ Uses existing table | **NONE** (already exists) |
| API Gateway routes | ❌ Not configured | **ADD routes** for `/collections` |
| Lambda permissions | ❌ Not set | **ADD DynamoDB permissions** |
| Environment variables | ❌ Not set | **ADD `TABLE_NAME`** |

---

## Quick Checklist

- [ ] Zip `collectionsHandler.js`
- [ ] Create Lambda function in AWS Console
- [ ] Upload code to Lambda
- [ ] Set environment variable: `TABLE_NAME=fashionstore-data`
- [ ] Add DynamoDB permissions to Lambda role
- [ ] Add API Gateway routes: `/collections` and `/collections/{name}`
- [ ] Enable CORS on new routes
- [ ] Deploy API Gateway
- [ ] Test with curl commands above
- [ ] Test home page in browser

---

## If You Want Me to Help

I can:
1. **Create a deployment script** (if you have AWS CLI set up)
2. **Create a CloudFormation template** (for infrastructure as code)
3. **Create a Terraform script** (if you use Terraform)
4. **Walk you through AWS Console deployment** (step-by-step with screenshots)

**Just tell me which option you prefer!** 🚀
