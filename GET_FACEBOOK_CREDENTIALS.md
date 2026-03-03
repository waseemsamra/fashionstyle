# How to Get Facebook App ID and App Secret

## Step-by-Step Guide

### 1. Go to Facebook Developers
Open: https://developers.facebook.com/

### 2. Login
- Login with your Facebook account
- If you don't have one, create a Facebook account first

### 3. Create App
- Click **"My Apps"** in top right corner
- Click **"Create App"** button
- Select **"Consumer"** as app type
- Click **"Next"**

### 4. Fill App Details
- **App Name**: `Fashion Store` (or your app name)
- **App Contact Email**: `waseemsamra@gmail.com`
- Click **"Create App"**
- Complete security check if prompted

### 5. Get App ID (Immediately Visible)
After creating the app, you'll see:
- **App ID**: `123456789012345` (example)
- This is displayed at the top of your app dashboard
- Copy this number

### 6. Get App Secret
- On the left sidebar, click **"Settings"**
- Click **"Basic"**
- You'll see:
  - **App ID**: (already visible)
  - **App Secret**: `********************************`
- Click **"Show"** button next to App Secret
- Enter your Facebook password to confirm
- Copy the revealed secret (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 7. Add Facebook Login Product
- On left sidebar, click **"Add Product"**
- Find **"Facebook Login"**
- Click **"Set Up"**
- Select **"Web"** platform
- Enter Site URL: `http://localhost:5173` (for development)
- Click **"Save"**

### 8. Configure OAuth Redirect URIs
- Go to **"Facebook Login"** → **"Settings"** (left sidebar)
- Under **"Valid OAuth Redirect URIs"**, add:
  ```
  https://fashionstore-prod.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
  ```
- Click **"Save Changes"**

### 9. Make App Live (Important!)
- Go to **"Settings"** → **"Basic"**
- Scroll to top of page
- You'll see **"App Mode: Development"**
- Click the toggle switch to change to **"Live"**
- Confirm the action

### 10. Use Credentials in AWS
Now use these credentials:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_qavi3JAVz \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details \
    client_id="YOUR_APP_ID_HERE" \
    client_secret="YOUR_APP_SECRET_HERE" \
    authorize_scopes="public_profile,email" \
  --attribute-mapping email=email name=name
```

## Quick Reference

**Where to find credentials:**
- **App ID**: Settings → Basic (always visible)
- **App Secret**: Settings → Basic → Click "Show" button

**Example values:**
- App ID: `123456789012345` (15-16 digits)
- App Secret: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` (32 characters)

## Important Notes

1. **Keep App Secret Private**: Never commit to Git or share publicly
2. **App Mode**: Must be "Live" for production use
3. **OAuth Redirect**: Must match exactly with Cognito domain
4. **Testing**: Use Development mode during testing, switch to Live for production

## Troubleshooting

**Can't see "Show" button for App Secret?**
- You must be an admin of the app
- Try refreshing the page

**App Secret not working?**
- Make sure you copied the entire secret
- No spaces before or after
- Regenerate if needed: Settings → Basic → Reset App Secret

**OAuth redirect error?**
- Verify redirect URI matches exactly
- Format: `https://[COGNITO_DOMAIN].auth.[REGION].amazoncognito.com/oauth2/idpresponse`
- No trailing slash

## Next Steps

After getting credentials:
1. Add to AWS Cognito (see FACEBOOK_LOGIN_SETUP.md)
2. Configure App Client in Cognito
3. Test login flow
4. Switch Facebook app to Live mode for production
