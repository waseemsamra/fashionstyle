#!/bin/bash
# setup-cloudfront.sh
# Creates CloudFront CDN for S3 images

set -e

REGION="us-east-1"
S3_BUCKET="fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com"
ORIGIN_ID="S3Origin-FashionStore"

echo "=================================================="
echo "🚀 Setting up CloudFront CDN for S3 Images"
echo "=================================================="
echo ""

# Step 1: Create CloudFront distribution
echo "Step 1: Creating CloudFront distribution..."

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --origin-domain-name "$S3_BUCKET" \
  --default-cache-policy-name CachingOptimized \
  --origin-access-control-origin-type s3 \
  --create-distribution-with-tags \
  --tags "Items=[{Key=Project,Value=FashionStore},{Key=Environment,Value=Production}]" \
  --query 'Distribution.Id' \
  --output text \
  --region "$REGION" 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "⚠️ Distribution creation via CLI failed. Creating with config file..."
  
  # Create distribution config
  cat > /tmp/cloudfront-config.json << 'EOF'
{
  "DistributionConfig": {
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3Origin-FashionStore",
          "DomainName": "fashionstore-products-1773891614v.s3.us-east-1.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3Origin-FashionStore",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"],
        "CachedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"]
        }
      },
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "Compress": true
    },
    "Comment": "FashionStore Product Images CDN",
    "Enabled": true,
    "DefaultRootObject": "",
    "PriceClass": "PriceClass_100"
  }
}
EOF

  DISTRIBUTION_ID=$(aws cloudfront create-distribution-with-tags \
    --distribution-config file:///tmp/cloudfront-config.json \
    --tags "Items=[{Key=Project,Value=FashionStore}]" \
    --query 'Distribution.Id' \
    --output text \
    --region "$REGION")
fi

echo "✅ Distribution created: $DISTRIBUTION_ID"

# Step 2: Wait for distribution to deploy
echo ""
echo "Step 2: Waiting for distribution to deploy (this takes 10-20 minutes)..."
echo "⏳ You can check status in AWS Console: https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions/$DISTRIBUTION_ID"

# Get domain name
DOMAIN_NAME=$(aws cloudfront get-distribution \
  --id "$DISTRIBUTION_ID" \
  --query 'Distribution.DomainName' \
  --output text \
  --region "$REGION")

echo ""
echo "📋 CloudFront Domain: $DOMAIN_NAME"
echo ""
echo "=================================================="
echo "✅ CloudFront Distribution Created!"
echo "=================================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Wait 10-20 minutes for deployment to complete"
echo ""
echo "2. Test the CDN:"
echo "   curl -I https://$DOMAIN_NAME/product-1.jpg"
echo ""
echo "3. Add to your .env file:"
echo "   VITE_CDN_URL=https://$DOMAIN_NAME"
echo ""
echo "4. Rebuild your app:"
echo "   npm run build"
echo ""
echo "🎉 Your images will now load 3-5x faster!"
echo ""
