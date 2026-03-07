# 🚀 Quick Deploy Orders API - Manual Method

## Why You're Seeing This Error
```
"Order created locally but failed to sync"
```

This happens because the Orders API endpoint doesn't exist in AWS yet.

---

## ✅ Solution: Deploy Lambda Manually (5 minutes)

### Step 1: Create Lambda Function

1. **Go to AWS Lambda Console**
   - https://console.aws.amazon.com/lambda/
   - Click **"Create function"**

2. **Choose "Author from scratch"**
   - Function name: `fashionstore-prod-orders`
   - Runtime: **Node.js 18.x**
   - Architecture: **x86_64**
   - Click **"Create function"**

3. **Add Code**
   - Scroll to "Code source"
   - Open file: `/Users/apple/Downloads/fashionstyle/lambda-orders.js`
   - Copy ALL the code
   - Paste into `index.js` in Lambda console
   - Click **"Deploy"**

4. **Set Environment Variable**
   - Scroll to "Configuration" → "Environment variables"
   - Click **"Edit"**
   - Add: `TABLE_NAME = fashionstore-prod`
   - Click **"Save"**

5. **Add Permissions**
   - Go to "Configuration" → "Permissions"
   - Click on the "Execution role" link
   - Click **"Attach policies"**
   - Search for: `DynamoDB`
   - Select: `AmazonDynamoDBFullAccess`
   - Click **"Attach policy"**

---

### Step 2: Add API Gateway Trigger

1. **Add Trigger**
   - In Lambda function, click **"Add trigger"**
   - Select: **API Gateway**
   - API Gateway: Choose your existing API (`8ur8l436ff`)
   - Stage: `prod`
   - Security: Open (for testing)
   - Click **"Add"**

2. **Configure API Gateway**
   - Go to API Gateway Console
   - Find your API: `8ur8l436ff`
   - Click **"Resources"**
   - Create Resource:
     - Path: `/users/{userId}/orders`
   - Add Methods:
     - **POST** (for creating orders)
     - **GET** (for getting orders)
     - **OPTIONS** (for CORS)
   - For each method:
     - Integration type: **Lambda Function**
     - Lambda Function: `fashionstore-prod-orders`
     - Enable CORS

3. **Deploy API**
   - Click **"Actions"** → **"Deploy API"**
   - Stage: `prod`
   - Click **"Deploy"**

---

### Step 3: Test

1. **Test API Endpoint**
   ```bash
   curl -X POST \
     https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod/users/TEST123/orders \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "ORD-TEST123",
       "items": [],
       "totalPrice": 99.99
     }'
   ```

2. **Expected Response**
   ```json
   {
     "message": "Order created successfully",
     "orderId": "ORD-TEST123"
   }
   ```

---

## ✅ After Deployment

1. **Rebuild your app** (if needed)
   ```bash
   npm run build
   ```

2. **Test checkout flow**
   - Add items to cart
   - Complete checkout
   - ✅ No more sync error!
   - Check User Dashboard → Orders
   - ✅ Order appears!

---

## 🐛 Troubleshooting

### Error: "Access Denied"
- Check IAM role has DynamoDB permissions
- Verify TABLE_NAME environment variable

### Error: "502 Bad Gateway"
- Lambda function failed
- Check CloudWatch Logs for details

### Error: "CORS Error"
- Enable CORS in API Gateway
- Add OPTIONS method

### Error: "Resource Not Found"
- Check API Gateway resource path
- Verify deployment to prod stage

---

## 📝 Alternative: Use CloudFormation

If you prefer CloudFormation:
1. Upload `orders-stack.yaml`
2. Stack name: `fashionstore-orders`
3. Wait for deployment

**Manual method is faster for testing!**

---

**Once deployed, the error will be gone!** ✅
