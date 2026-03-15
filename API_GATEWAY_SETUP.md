# API Gateway Configuration Guide - Settings API

## 🎯 Quick Setup via AWS Console

### Step 1: Create Resource

1. **Go to API Gateway Console**
2. **Select your API**: `xpyh8srop0`
3. **Click "Resources"** in left menu
4. **Click "Create Resource"**
5. **Configure:**
   - Resource Name: `settings-v2`
   - Resource Path: `/settings-v2`
   - Enable CORS: ✅ YES
   - Click "Create Resource"

### Step 2: Create Proxy Resource

1. **Select the `/settings-v2` resource** you just created
2. **Click "Create Resource"**
3. **Configure:**
   - Resource Name: `section-proxy`
   - Resource Path: `/{section+}`
   - Enable CORS: ✅ YES
   - Click "Create Resource"

### Step 3: Create Methods

For the `/{section+}` resource, create these methods:

#### GET Method
1. **Select `/{section+}` resource**
2. **Click "Create Method"**
3. **Select "GET"**
4. **Configure:**
   - Authorization: `NONE`
   - API Key Required: ❌ NO
   - Integration Type: `Lambda Function`
   - Use Lambda Proxy Integration: ✅ YES
   - Lambda Function: `fashionstore-prod-settings-complete`
   - Lambda Region: `us-east-1`
   - Click "Save"

#### POST Method
1. **Repeat GET steps** but select "POST"
2. Same configuration

#### PUT Method
1. **Repeat GET steps** but select "PUT"
2. Same configuration

#### DELETE Method
1. **Repeat GET steps** but select "DELETE"
2. Same configuration

#### PATCH Method
1. **Repeat GET steps** but select "PATCH"
2. Same configuration

#### OPTIONS Method (CORS)
1. **Repeat GET steps** but select "OPTIONS"
2. This enables CORS preflight

### Step 4: Add Lambda Permissions

Go to Lambda Console → `fashionstore-prod-settings-complete` → Permissions

Add this permission:
```
API Gateway Invoke
Principal: apigateway.amazonaws.com
Source ARN: arn:aws:execute-api:us-east-1:*:xpyh8srop0/*/*/*
```

### Step 5: Deploy API

1. **Click "Actions"** → "Deploy API"
2. **Deployment Stage**: `prod`
3. **Click "Deploy"**

### Step 6: Test Endpoints

**Test GET Categories:**
```bash
curl -X GET "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/settings-v2/categories"
```

**Test POST Categories:**
```bash
curl -X POST "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/settings-v2/categories" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"test","name":"Test Category"}]}'
```

## 📋 All Supported Endpoints

After configuration, these endpoints will work:

### Categories
```
GET    /admin/settings-v2/categories
POST   /admin/settings-v2/categories
PUT    /admin/settings-v2/categories/:id
DELETE /admin/settings-v2/categories/:id
```

### Store Information
```
GET    /admin/settings-v2/store
POST   /admin/settings-v2/store
PUT    /admin/settings-v2/store/:id
```

### Colors
```
GET    /admin/settings-v2/colors
POST   /admin/settings-v2/colors
PUT    /admin/settings-v2/colors/:id
DELETE /admin/settings-v2/colors/:id
```

### Materials
```
GET    /admin/settings-v2/materials
POST   /admin/settings-v2/materials
PUT    /admin/settings-v2/materials/:id
DELETE /admin/settings-v2/materials/:id
```

### Sizes
```
GET    /admin/settings-v2/sizes
POST   /admin/settings-v2/sizes
PUT    /admin/settings-v2/sizes/:id
DELETE /admin/settings-v2/sizes/:id
```

### Patterns
```
GET    /admin/settings-v2/patterns
POST   /admin/settings-v2/patterns
PUT    /admin/settings-v2/patterns/:id
DELETE /admin/settings-v2/patterns/:id
```

### Occasions
```
GET    /admin/settings-v2/occasions
POST   /admin/settings-v2/occasions
PUT    /admin/settings-v2/occasions/:id
DELETE /admin/settings-v2/occasions/:id
```

### Gender
```
GET    /admin/settings-v2/genders
POST   /admin/settings-v2/genders
PUT    /admin/settings-v2/genders/:id
DELETE /admin/settings-v2/genders/:id
```

### General Settings
```
GET    /admin/settings-v2/general
POST   /admin/settings-v2/general
PUT    /admin/settings-v2/general/:id
```

## ✅ Verification Checklist

After configuration, verify:

- [ ] Lambda function deployed: `fashionstore-prod-settings-complete`
- [ ] API Gateway resource created: `/admin/settings-v2/{section+}`
- [ ] All methods created: GET, POST, PUT, DELETE, PATCH, OPTIONS
- [ ] Lambda permissions added
- [ ] API deployed to `prod` stage
- [ ] CORS enabled
- [ ] Test endpoints work

## 🧪 Test with Postman

1. **Create new request**
2. **Method**: GET
3. **URL**: `https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/settings-v2/categories`
4. **Headers**:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
5. **Send**
6. **Expected Response**:
   ```json
   {
     "categories": [
       {"id": "1", "name": "Casual"},
       {"id": "2", "name": "Formal"}
     ]
   }
   ```

## 🚨 Troubleshooting

### 502 Bad Gateway
- Check Lambda function exists
- Check Lambda permissions
- Check integration type is `AWS_PROXY`

### 403 Forbidden
- Check authorization type is `NONE`
- Check Lambda permissions include API Gateway principal

### CORS Error
- Enable CORS on resource
- Add OPTIONS method
- Deploy API again

### 500 Internal Server Error
- Check CloudWatch Logs for Lambda errors
- Verify DynamoDB table exists
- Check JWT token is valid

## 📞 Next Steps

After API Gateway is configured:

1. **Test all endpoints** with Postman
2. **Update frontend** to use new endpoints
3. **Deploy to Amplify**
4. **Test on live site**
