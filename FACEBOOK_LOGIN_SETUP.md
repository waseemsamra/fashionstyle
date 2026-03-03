# Facebook Login Setup for AWS Cognito

## Prerequisites
- AWS Cognito User Pool: `us-east-1_qavi3JAVz`
- Facebook Developer Account

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Consumer" as app type
4. Enter app details:
   - App Name: `Fashion Store`
   - Contact Email: `waseemsamra@gmail.com`
5. Click "Create App"

## Step 2: Configure Facebook Login

1. In Facebook App Dashboard, go to "Add Products"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web" platform
4. Enter Site URL: `https://your-domain.com` (or localhost for testing)
5. Go to Facebook Login → Settings
6. Add OAuth Redirect URIs:
   ```
   https://fashionstore-prod.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```
7. Save changes

## Step 3: Get Facebook App Credentials

1. Go to Settings → Basic
2. Copy:
   - **App ID**: (e.g., 123456789012345)
   - **App Secret**: Click "Show" and copy

## Step 4: Configure Cognito User Pool

### Via AWS Console:

1. Go to AWS Console → Cognito → User Pools
2. Select pool: `us-east-1_qavi3JAVz`
3. Go to "Sign-in experience" tab
4. Click "Add identity provider"
5. Select "Facebook"
6. Enter:
   - **App ID**: [Your Facebook App ID]
   - **App secret**: [Your Facebook App Secret]
   - **Authorize scopes**: `public_profile,email`
7. Click "Add identity provider"

### Via AWS CLI:

```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_qavi3JAVz \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details \
    client_id="YOUR_FACEBOOK_APP_ID" \
    client_secret="YOUR_FACEBOOK_APP_SECRET" \
    authorize_scopes="public_profile,email" \
  --attribute-mapping \
    email=email \
    name=name
```

## Step 5: Update App Client Settings

1. In Cognito User Pool, go to "App integration" tab
2. Select your app client: `2o9mbemohjr2re5qd0o045gir0`
3. Click "Edit" under "Hosted UI settings"
4. Under "Identity providers", check "Facebook"
5. Add Callback URLs:
   ```
   http://localhost:5173/
   https://your-domain.com/
   ```
6. Add Sign-out URLs:
   ```
   http://localhost:5173/
   https://your-domain.com/
   ```
7. Under "OAuth 2.0 grant types", enable:
   - Authorization code grant
   - Implicit grant
8. Under "OpenID Connect scopes", enable:
   - openid
   - email
   - profile
9. Save changes

## Step 6: Update Amplify Configuration

Add to `.env`:
```env
VITE_OAUTH_DOMAIN=fashionstore-prod.auth.us-east-1.amazoncognito.com
VITE_OAUTH_REDIRECT_SIGN_IN=http://localhost:5173/
VITE_OAUTH_REDIRECT_SIGN_OUT=http://localhost:5173/
```

Update `src/config/aws-config.ts`:
```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_OAUTH_DOMAIN || '',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_OAUTH_REDIRECT_SIGN_IN || ''],
          redirectSignOut: [import.meta.env.VITE_OAUTH_REDIRECT_SIGN_OUT || ''],
          responseType: 'code'
        }
      }
    }
  }
}, {
  ssr: false
});

export default Amplify;
```

## Step 7: Test Facebook Login

1. Start your app: `npm run dev`
2. Go to login page
3. Click "Facebook" button
4. You'll be redirected to Facebook login
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### Error: "Invalid OAuth Redirect URI"
- Ensure redirect URI in Facebook App matches Cognito domain exactly
- Format: `https://[USER_POOL_DOMAIN].auth.[REGION].amazoncognito.com/oauth2/idpresponse`

### Error: "App Not Set Up"
- Make Facebook app live in Facebook Developer Console
- Go to Settings → Basic → App Mode → Switch to "Live"

### Error: "Invalid Scopes"
- Ensure scopes in Cognito match Facebook app permissions
- Default: `public_profile,email`

## Phone Number Verification Setup

For SMS verification, configure SNS:

```bash
# Create SNS role for Cognito
aws iam create-role \
  --role-name CognitoSNSRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "cognito-idp.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach SNS policy
aws iam attach-role-policy \
  --role-name CognitoSNSRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess

# Update User Pool with SNS role
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_qavi3JAVz \
  --sms-configuration \
    SnsCallerArn=arn:aws:iam::536217686312:role/CognitoSNSRole
```

## Notes

- Facebook login requires HTTPS in production
- Test with localhost during development
- Phone verification requires SNS configuration and may incur SMS costs
- Email verification is free and enabled by default
