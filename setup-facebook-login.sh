#!/bin/bash

echo "=== Step 1: Add Facebook Identity Provider ==="
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_qavi3JAVz \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details \
    client_id="2381337682338436" \
    client_secret="01ec02fc258a5b1c96dfc5a7b88e5d5b" \
    authorize_scopes="public_profile,email" \
  --attribute-mapping \
    email=email \
    name=name \
    username=id

echo ""
echo "=== Step 2: Update App Client ==="
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_qavi3JAVz \
  --client-id 2o9mbemohjr2re5qd0o045gir0 \
  --supported-identity-providers Facebook COGNITO \
  --callback-urls "http://localhost:5173/" \
  --logout-urls "http://localhost:5173/" \
  --allowed-o-auth-flows code implicit \
  --allowed-o-auth-scopes openid email profile \
  --allowed-o-auth-flows-user-pool-client

echo ""
echo "✅ Facebook login configured!"
echo ""
echo "Make sure in Facebook app:"
echo "1. OAuth Redirect URI: https://fashionstore-prod.auth.us-east-1.amazoncognito.com/oauth2/idpresponse"
echo "2. App Mode: Live"
