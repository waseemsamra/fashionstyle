#!/bin/bash

# Update Cognito App Client to enable Facebook login
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_qavi3JAVz \
  --client-id 2o9mbemohjr2re5qd0o045gir0 \
  --supported-identity-providers Facebook COGNITO \
  --callback-urls "http://localhost:5173/" "https://your-domain.com/" \
  --logout-urls "http://localhost:5173/" "https://your-domain.com/" \
  --allowed-o-auth-flows code implicit \
  --allowed-o-auth-scopes openid email profile \
  --allowed-o-auth-flows-user-pool-client

echo "App client updated successfully!"
echo ""
echo "OAuth Domain: fashionstore-prod.auth.us-east-1.amazoncognito.com"
echo ""
echo "Add this to Facebook app OAuth Redirect URIs:"
echo "https://fashionstore-prod.auth.us-east-1.amazoncognito.com/oauth2/idpresponse"
