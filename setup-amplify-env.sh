#!/bin/bash

APP_ID="d1l8ayoz0simv1"
BRANCH="main"

echo "Adding environment variables to Amplify..."

aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables \
    VITE_API_URL=https://8ur8l436ff.execute-api.us-east-1.amazonaws.com/prod \
    VITE_GRAPHQL_URL=https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql \
    VITE_GRAPHQL_API_KEY=da2-aadwbwrozrfgriafn6pgjjhrca \
    VITE_USER_POOL_ID=us-east-1_qavi3JAVz \
    VITE_USER_POOL_CLIENT_ID=2o9mbemohjr2re5qd0o045gir0 \
    VITE_IDENTITY_POOL_ID=us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927 \
    VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com \
    VITE_OAUTH_REDIRECT_SIGN_IN=https://main.d1l8ayoz0simv1.amplifyapp.com/ \
    VITE_OAUTH_REDIRECT_SIGN_OUT=https://main.d1l8ayoz0simv1.amplifyapp.com/ \
    VITE_S3_BUCKET=fashionstore-prod-assets-536217686312 \
    VITE_S3_URL=http://fashionstore-prod-assets-536217686312.s3-website-us-east-1.amazonaws.com \
    VITE_AWS_REGION=us-east-1 \
  --region us-east-1

echo "Environment variables added!"
echo "Triggering new build..."

aws amplify start-job \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --job-type RELEASE \
  --region us-east-1

echo "Build triggered! Check Amplify console for progress."
