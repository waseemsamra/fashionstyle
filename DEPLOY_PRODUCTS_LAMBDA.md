# Deploy Products Lambda with Brand Filtering

## What's New

The products Lambda handler now supports proper server-side filtering by:
- **Brand** (case-insensitive, fuzzy matching)
- **Category**
- **Search keyword** (searches name, description, brand)
- **Pagination** (limit, page)
- **Active status**

## Deployment Steps

### Option 1: AWS Console (Manual)

1. Go to AWS Lambda Console
2. Find function: `fashionstore-universal-products`
3. Click "Code" tab
4. Upload `lambda/productsHandler.js` as `index.js`
5. Click "Deploy"

### Option 2: AWS CLI

```bash
cd lambda
zip products-handler.zip productsHandler.js
aws lambda update-function-code \
  --function-name fashionstore-universal-products \
  --zip-file fileb://products-handler.zip \
  --region us-east-1
```

### Option 3: Node.js Script

```bash
cd lambda
npm install archiver @aws-sdk/client-lambda
node deploy-products-lambda.js
```

## Environment Variables

Ensure your Lambda has:
```
TABLE_NAME=fashionstore-data
```

## Testing

After deployment, test the API:

```bash
# Get all products
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/products"

# Filter by brand
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/products?brand=Maria%20B"

# Filter by category
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/products?category=Bridal%20Wear"

# Search
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/products?search=embroidered"

# Pagination
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/products?limit=50&page=1"
```

## Frontend Changes

Updated `src/services/apiGatewayClient.ts`:
- `productsApi.getAll()` now accepts filters object:
  ```typescript
  productsApi.getAll({
    brand: 'Maria B',
    category: 'Bridal Wear',
    search: 'embroidered',
    limit: 50,
    page: 1,
    isActive: true,
  })
  ```

## Response Format

```json
{
  "products": [...],
  "count": 45,
  "total": 450,
  "page": 1,
  "limit": 50
}
```
