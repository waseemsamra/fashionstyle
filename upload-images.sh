#!/bin/bash

BUCKET="fashionstore-prod-assets-536217686312"
TABLE="fashionstore-prod-catalog"
S3_URL="http://fashionstore-prod-assets-536217686312.s3-website-us-east-1.amazonaws.com"

echo "Uploading images to S3..."
cd public
for img in *.jpg; do
  aws s3 cp "$img" "s3://$BUCKET/images/$img" --region us-east-1
done
cd ..

echo "Images uploaded! Update your DynamoDB products to use:"
echo "$S3_URL/images/product-1.jpg"
echo "$S3_URL/images/product-2.jpg"
echo "etc..."
