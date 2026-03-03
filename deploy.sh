#!/bin/bash

echo "🚀 Building React app..."
npm run build

echo "📦 Deploying to S3..."
aws s3 sync dist/ s3://fashionstore-prod-assets-536217686312 --delete

echo "✅ Deployment complete!"
echo "🌐 Live at: http://fashionstore-prod-assets-536217686312.s3-website-us-east-1.amazonaws.com"
