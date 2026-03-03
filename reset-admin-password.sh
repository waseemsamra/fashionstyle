#!/bin/bash

# Reset admin user password to permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --password "Admin@123" \
  --permanent

echo "Password set to permanent: Admin@123"
