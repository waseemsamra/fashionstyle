# Upload Public Images to S3

This guide will help you transfer all images from the `public` folder to your S3 bucket.

## Prerequisites

### 1. AWS Credentials

You need AWS access keys with S3 permissions. If you don't have them:

1. Go to the **AWS IAM Console**: https://console.aws.amazon.com/iam/
2. Click **Users** → **Create user**
3. Enter a username (e.g., `fashionstore-s3-uploader`)
4. Select **Attach policies directly**
5. Add the **AmazonS3FullAccess** policy (or create a custom policy with limited permissions)
6. Click **Create user**
7. Go to the user details → **Security credentials** tab
8. Click **Create access key**
9. Copy the **Access key ID** and **Secret access key**

### 2. Update .env File

Open your `.env` file and add your AWS credentials:

```bash
# AWS Credentials for S3 Upload
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
```

## Upload Images

### Option 1: Using Node.js Script (Recommended)

Run the upload script:

```bash
node upload-to-s3.js
```

This will:
- Upload all images from the `public` folder to your S3 bucket
- Make them publicly accessible
- Show you the S3 URLs for each image

### Option 2: Using AWS CLI

If you have AWS CLI installed:

```bash
# Configure AWS CLI (first time only)
aws configure

# Upload images
./upload-to-s3.sh
```

## Update Code to Use S3 URLs

After uploading, update your code to use S3 URLs:

```bash
node update-image-paths-to-s3.js
```

This will automatically update:
- `src/data/products.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/About.tsx`

## Manual Update (Alternative)

If you prefer to update manually, replace local paths with S3 URLs:

**Before:**
```typescript
src="/hero-image.jpg"
image: '/product-1.jpg'
```

**After:**
```typescript
src="https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/hero-image.jpg"
image: "https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/product-1.jpg"
```

## Verify Upload

Visit your S3 bucket in the AWS Console:
https://console.aws.amazon.com/s3/buckets/fashionstore-products-1773891614v

Or test an image URL directly:
```
https://fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com/hero-image.jpg
```

## Troubleshooting

### "CredentialsProviderError"
- Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correctly set in `.env`
- Make sure there are no extra spaces or quotes

### "Access Denied"
- Verify your IAM user has S3 permissions
- Check that the bucket policy allows public reads

### "Bucket not found"
- Verify the bucket name in `VITE_S3_BUCKET` matches your S3 bucket
- Check the region in `VITE_AWS_REGION`

## Scripts Created

- `upload-to-s3.js` - Uploads images to S3 using AWS SDK
- `upload-to-s3.sh` - Uploads images to S3 using AWS CLI
- `update-image-paths-to-s3.js` - Updates code to use S3 URLs
