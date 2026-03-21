# Admin Product Management with S3 Image Upload

## Overview

Your admin panel is now fully integrated with AWS S3 for product image management. You can upload, update, and delete product images directly from the admin interface.

## Features

### ✅ What's Configured:

1. **Admin Products Page** (`/admin/products`)
   - View all products from DynamoDB
   - Add new products
   - Edit existing products
   - Delete products

2. **S3 Image Upload**
   - Upload product images directly to your S3 bucket
   - Bucket: `fashionstore-products-1773891614v`
   - Region: `us-east-1`
   - Supports single and multiple image uploads
   - Max 5 images per product
   - Max 5MB per image

3. **Product Form**
   - Basic Info: Name, Description, Price, Category, Brand
   - Images: Main image + up to 5 gallery images
   - Details: Sizes, Colors, Materials, Patterns
   - Attributes: Occasions, Genders

## How to Use

### 1. Access Admin Panel

1. Go to your app: `http://localhost:5173`
2. Navigate to: `/admin/products`
3. Log in with your admin credentials

### 2. Add a New Product

1. Click **"Add Product"** button
2. Fill in the **Basic Info** tab:
   - Product Name
   - Description
   - Price
   - Category
   - Brand
   - SKU
   - Stock Quantity

3. Go to **Images** tab:
   - Upload **Main Image** (required)
   - Upload up to 5 **Gallery Images** (optional)
   - Images are automatically uploaded to S3
   - First gallery image is marked as "Main"

4. Fill in **Details** tab:
   - Select Sizes (XS, S, M, L, XL, XXL)
   - Select Colors
   - Add Materials, Patterns, Occasions (optional)

5. Click **Submit** to save

### 3. Edit a Product

1. Find the product in the list
2. Click the **Edit** (pencil) icon
3. Update any fields
4. Change images if needed:
   - Click on image upload to replace
   - Click X on image to remove
   - Upload new images
5. Click **Submit** to save changes

### 4. Delete a Product

1. Find the product in the list
2. Click the **Delete** (trash) icon
3. Confirm deletion
4. Product is removed from DynamoDB

## S3 Image URLs

Images uploaded to S3 will have URLs like:
```
https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/products/1234567890-image.jpg
```

These URLs are automatically saved to the product in DynamoDB.

## Configuration

### Environment Variables (`.env`)

```bash
# API Gateway Configuration
VITE_API_URL=https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod

# S3 Configuration
VITE_S3_BUCKET=fashionstore-products-1773891614v
VITE_AWS_REGION=us-east-1

# AWS Credentials (for direct uploads)
AWS_ACCESS_KEY_ID=AKIAXZWIQSEUA4VGC4X3
AWS_SECRET_ACCESS_KEY=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
```

## Files Updated

1. **`src/services/s3Upload.ts`**
   - Updated S3 bucket configuration
   - Uses environment variables
   - Handles image upload to S3

2. **`src/hooks/useProducts.ts`**
   - Updated API URL to use environment variable
   - Fetches products from DynamoDB via API

3. **`src/services/api.ts`**
   - Updated API URL configuration
   - Used by product listing components

4. **`src/components/admin/ProductForm.tsx`**
   - Integrated with ImageUpload component
   - Supports S3 upload

5. **`src/components/ui/ImageUpload.tsx`**
   - Handles file selection and upload
   - Shows upload progress
   - Displays previews

## Troubleshooting

### Images Not Uploading

1. Check AWS credentials in `.env`
2. Verify S3 bucket exists and is accessible
3. Check browser console for errors
4. Ensure Block Public Access is disabled on S3 bucket

### Products Not Loading

1. Check `VITE_API_URL` in `.env`
2. Verify API Gateway endpoint is deployed
3. Check DynamoDB table has products
4. Ensure you're logged in with valid token

### "Session Expired" Error

1. Log out and log in again
2. Token may have expired (default: 1 hour)
3. Check Cognito configuration

## API Endpoints Used

- `GET /products` - List all products
- `GET /products/:id` - Get single product
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `POST /generate-upload-url` - Get S3 presigned URL

## Next Steps

1. **Test Image Upload:**
   - Go to admin products
   - Add a new product
   - Upload images
   - Verify images appear on shop page

2. **Verify S3 Integration:**
   - Check S3 console for uploaded images
   - Verify image URLs are accessible

3. **Update Product Data:**
   - Edit existing products
   - Change images
   - Verify changes reflect immediately

## Support

If you encounter issues:
1. Check browser console for errors
2. Review network tab for failed requests
3. Verify AWS credentials are correct
4. Check API Gateway logs in AWS Console
