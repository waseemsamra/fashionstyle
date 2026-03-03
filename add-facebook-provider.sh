#!/bin/bash

# Add Facebook as identity provider to Cognito User Pool
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

echo "Facebook identity provider added successfully!"
echo ""
echo "Next steps:"
echo "1. Update App Client to enable Facebook"
echo "2. Add OAuth redirect URIs"
echo "3. Configure Facebook app with Cognito domain"
