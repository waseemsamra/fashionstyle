#!/bin/bash

# S3 Image Upload Script
# This script uploads all images from the public folder to S3

S3_BUCKET="fashionstore-products-1773891614v"
S3_REGION="us-east-1"
PUBLIC_FOLDER="./public"

echo "🚀 Starting image upload to S3..."
echo ""
echo "📦 Bucket: $S3_BUCKET"
echo "📁 Source: $PUBLIC_FOLDER"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it or use the Node.js script instead."
    echo ""
    echo "Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured."
    echo ""
    echo "Run: aws configure"
    echo "Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    exit 1
fi

# Upload images
echo "📸 Uploading images..."
echo ""

aws s3 cp $PUBLIC_FOLDER s3://$S3_BUCKET/ \
    --include "*.jpg" \
    --include "*.jpeg" \
    --include "*.png" \
    --include "*.gif" \
    --include "*.svg" \
    --include "*.webp" \
    --acl public-read \
    --recursive

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Upload completed successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Your images are now available at:"
    echo "   https://$S3_BUCKET.s3.$S3_REGION.amazonaws.com/[image-name]"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update src/data/products.ts to use S3 URLs"
    echo "   2. Update component files (Hero.tsx, About.tsx) to use S3 URLs"
    echo ""
else
    echo ""
    echo "❌ Upload failed. Please check the error messages above."
    exit 1
fi
