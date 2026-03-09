# Backend Users API Setup

## What Was Changed

### 1. Updated `fashion-store-stack.yaml`
- Modified the `UsersLambda` function to query DynamoDB and return all users
- Added `GET /users` endpoint - Lists all users from DynamoDB
- Added `GET /users/{userId}` endpoint - Gets single user profile
- Added CORS support with OPTIONS methods

### 2. Updated Frontend
- `src/pages/admin/Users.tsx` - Now fetches real users from API
- `src/services/api.ts` - Added `getUsers()` method

### 3. User Profile Auto-Creation
- `src/pages/user/Login.tsx` - Auto-creates user profile in DynamoDB after signup

## Backend Architecture

```
API Gateway: xpyh8srop0
Endpoint: https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users
Lambda: fashionstore-prod-get-users-prod
DynamoDB: fashionstore-prod (User profiles stored with PK=USER#{userId})
```

## Deployment

### Option 1: Using the Script (If AWS CLI is available)

```bash
./deploy-fashion-store-stack.sh
```

### Option 2: AWS Console (Manual)

1. Go to CloudFormation Console:
   ```
   https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks
   ```

2. Find stack: `fashion-store` (or create new one)

3. Click "Update" → "Replace current template"

4. Upload `fashion-store-stack.yaml`

5. Click "Update stack"

### Option 3: AWS CLI Command

```bash
aws cloudformation deploy \
  --template-file fashion-store-stack.yaml \
  --stack-name fashion-store \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## Test the API

After deployment, test the endpoint:

```bash
# List all users
curl https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users

# Get single user
curl https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/testuser

# Expected response:
# {"users":[{"userId":"test","email":"test@example.com","firstName":"","lastName":"","contact":"","createdAt":"2024-..."}],"total":1}
```

## How It Works

### User Signup Flow:
1. User signs up via Cognito
2. Email verification code is sent
3. User verifies email
4. **Auto-creates profile in DynamoDB** with structure:
   ```
   PK: USER#testuser
   SK: PROFILE
   profile: {
     email: "test@example.com",
     firstName: "",
     lastName: "",
     contact: ""
   }
   createdAt: "2024-..."
   ```

### Admin Users List Flow:
1. Admin visits `/admin/users`
2. Frontend calls `GET /users` endpoint
3. Lambda queries DynamoDB for all `USER#*` items
4. Returns list of users with their profile data
5. Admin sees the list in the table

## DynamoDB Structure

```
Table: fashionstore-prod

Partition Key (PK)          | Sort Key (SK)  | profile
----------------------------|----------------|------------------
USER#john                   | PROFILE        | {email, firstName, ...}
USER#jane                   | PROFILE        | {email, firstName, ...}
ORDER#ORD123                | ORDER#ORD123   | {...}
PRODUCT#PROD123             | PRODUCT#PROD123| {...}
```

## Troubleshooting

### 1. API returns 500 error
- Check Lambda logs in CloudWatch
- Verify DynamoDB table name is `fashionstore-prod`
- Check Lambda has Query permission on DynamoDB

### 2. No users showing
- Verify users have signed up and verified email
- Check DynamoDB for `USER#*` items
- Test Lambda function directly

### 3. CORS error
- Verify OPTIONS method is configured in API Gateway
- Check API Gateway deployment is complete

## Files Modified

- ✅ `fashion-store-stack.yaml` - Lambda code + API Gateway config
- ✅ `src/pages/admin/Users.tsx` - Admin users page
- ✅ `src/services/api.ts` - API client method
- ✅ `src/pages/user/Login.tsx` - Auto-create profile on signup
- ✅ `lambda-user-profile.js` - Alternative users endpoint
- ✅ `user-profile-stack.yaml` - Alternative deployment

## Next Steps

1. **Deploy the stack** using one of the methods above
2. **Test the API** with curl
3. **Visit admin panel** at `http://localhost:4173/admin/users`
4. **Sign up a test user** to see it appear in the list
