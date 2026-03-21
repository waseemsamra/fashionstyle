# 📦 Populate Products - Quick Guide

## Add 10 Sample Products to Your Store

### Method 1: Browser Script (Easiest - Recommended)

**What it does:** Adds products via your API (uses POST /products)

**Steps:**
1. Open your admin panel and log in
2. Press F12 to open browser console
3. Copy entire content of `populate-products.js`
4. Paste in console and press Enter
5. Wait for success messages
6. Refresh the page

**Output:**
```
🚀 Starting to populate products...
📦 Total products to add: 10
🔑 Token present: true
---
📝 Adding product 1/10: Premium Cotton Kurta...
✅ Success: Premium Cotton Kurta (ID: 1773884xxx)
...
🎉 Population complete!
✅ Success: 10 products
❌ Failed: 0 products
🔄 Refresh the page to see all products!
```

### Method 2: Node.js Script (Direct to DynamoDB)

**What it does:** Writes directly to DynamoDB (bypasses API)

**Requirements:**
- AWS credentials configured
- Node.js installed
- AWS SDK installed

**Setup:**
```bash
# Configure AWS credentials
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Or create ~/.aws/credentials file
```

**Run:**
```bash
node populate-products-direct.js
```

**Output:**
```
🚀 Starting to populate DynamoDB directly...
📦 Table: fashionstore-data
📦 Total products to add: 10
---
📝 Adding product 1/10: Premium Cotton Kurta...
✅ Success: Premium Cotton Kurta (ID: PROD-1773884xxx-0)
...
🎉 Population complete!
✅ Success: 10 products
❌ Failed: 0 products
```

## 📦 Products Added

Both scripts add the same 10 products:

| # | Product | Brand | Category | Price | Image |
|---|---------|-------|----------|-------|-------|
| 1 | Premium Cotton Kurta | Khaadi | Casual Wear | $49 | ✅ |
| 2 | Elegant Silk Lehenga | Maria B | Bridal Wear | $299 | ✅ |
| 3 | Embroidered Dupatta | Sapphire | Formal Wear | $79.99 | ✅ |
| 4 | Classic Linen Shirt | J. | Casual Wear | $59.99 | ✅ |
| 5 | Designer Wedding Gown | Elan | Bridal Wear | $599.99 | ✅ |
| 6 | Casual Denim Jeans | Outfitters | Casual Wear | $89.99 | ✅ |
| 7 | Formal Blazer | Charcoal | Formal Wear | $199.99 | ✅ |
| 8 | Summer Lawn Dress | Gul Ahmed | Casual Wear | $69.99 | ✅ |
| 9 | Velvet Sherwani | Amir Adnan | Bridal Wear | $449.99 | ✅ |
| 10 | Printed Kurti | Ideas | Casual Wear | $39.99 | ✅ |

All images hosted on: `fashionstore-prod-assets-536217686312.s3.amazonaws.com`

## ❓ Which Method to Choose?

**Use Browser Script (Method 1) if:**
- ✅ You're already logged into admin
- ✅ You want to test the API
- ✅ You don't have AWS credentials handy
- ✅ You want the simplest approach

**Use Node.js Script (Method 2) if:**
- ✅ You have AWS credentials configured
- ✅ You want to add products directly to DB
- ✅ You want to automate product imports
- ✅ You're comfortable with command line

## 🎯 After Adding Products

1. **Refresh the admin products page**
2. **Verify products appear**
3. **Test editing a product**
4. **Test deleting a product**
5. **Check the customer-facing shop page**

## 🐛 Troubleshooting

### "No authentication token found"
- Log in to the admin panel first
- Make sure you're on the admin page when running the script

### "Failed to add product"
- Check API Gateway is deployed
- Verify Lambda function is working
- Check browser console for detailed errors

### "AWS credentials not found" (Method 2)
- Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables
- Or create `~/.aws/credentials` file
- Or run on EC2 with IAM role

### Products not showing after adding
- Refresh the page
- Check browser console for errors
- Verify API is returning products: `GET /products`

## 📝 Notes

- Products are added with unique IDs (timestamp-based)
- All products are marked as `isActive: true`
- Some are marked as `isFeatured: true` or `isSale: true`
- Stock levels vary (10-100 units)
- All have complete metadata (sizes, colors, materials, etc.)

## 🚀 Next Steps

After populating products:
1. ✅ Test browsing products on shop page
2. ✅ Test adding to cart
3. ✅ Test checkout flow
4. ✅ Add more products if needed
5. ✅ Configure categories and filters

**Your store is now ready! 🎉**
