# Complete Users API with Cognito Integration

## ✅ What's New

**Admin can now see ALL registered users from Cognito User Pool** - not just users with DynamoDB profiles!

### Key Features:
- ✅ Lists ALL users from Cognito User Pool
- ✅ Shows users even without DynamoDB profiles
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Delete removes from both Cognito AND DynamoDB
- ✅ Edit updates DynamoDB profile
- ✅ Search by email

---

## Backend Changes

### Lambda Function Updated
**File:** `fashion-store-stack.yaml` - UsersLambda

**New Capabilities:**
1. **GET /users** - Lists all users from Cognito User Pool
2. **GET /users/{userId}** - Gets user from Cognito + profile from DynamoDB
3. **POST /users** - Creates user in Cognito + DynamoDB
4. **PUT /users/{userId}** - Updates DynamoDB profile
5. **DELETE /users/{userId}** - Deletes from Cognito AND DynamoDB

### IAM Permissions Added
```yaml
CognitoAccess:
  - cognito-idp:ListUsers
  - cognito-idp:AdminGetUser
  - cognito-idp:AdminCreateUser
  - cognito-idp:AdminDeleteUser
  - cognito-idp:AdminUpdateUserAttributes
```

---

## How It Works

### List Users Flow
```
Admin visits /admin/users
    ↓
Frontend: GET /users with JWT token
    ↓
Backend: cognito.listUsers() → Gets ALL users from Cognito
    ↓
For each user: Try to get DynamoDB profile (optional)
    ↓
Return: Combined list with Cognito + Profile data
```

### Delete User Flow
```
Admin clicks delete
    ↓
Frontend: DELETE /users/{userId}
    ↓
Backend: 
  1. cognito.adminDeleteUser() → Remove from Cognito
  2. dynamodb.delete() → Remove profile
    ↓
Return: Success
```

---

## Deployment

### Deploy with AWS CLI
```bash
cd /Users/apple/Downloads/fashionstyle
./deploy-fashion-store-stack.sh
```

### Manual Deployment
```bash
aws cloudformation deploy \
  --template-file fashion-store-stack.yaml \
  --stack-name fashion-store \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Update Via AWS Console
1. Go to CloudFormation Console
2. Find stack: `fashion-store`
3. Click "Update"
4. Upload updated `fashion-store-stack.yaml`
5. Click "Update stack"

---

## API Reference

### List All Users
```bash
curl -X GET "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "userId": "waseem-samra",
      "email": "waseem.samra@tcmiglobal.com",
      "firstName": "",
      "lastName": "",
      "role": "customer",
      "status": "CONFIRMED",
      "enabled": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### Delete User
```bash
curl -X DELETE "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/waseem-samra" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "message": "User deleted successfully",
  "userId": "waseem-samra"
}
```

### Create User
```bash
curl -X POST "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "role": "customer",
    "status": "active"
  }'
```

### Update User
```bash
curl -X PUT "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/waseem-samra" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Waseem",
    "lastName": "Samra",
    "role": "admin"
  }'
```

---

## Frontend Usage

### Admin Users Page
Visit: `http://localhost:4173/admin/users`

**Features:**
- ✅ Shows ALL users from Cognito
- ✅ Refresh button to reload list
- ✅ Add User button
- ✅ Edit button (opens modal)
- ✅ Delete button (with confirmation)

### Console Logs
```
🔍 Admin auth check - JWT token: true Email: admin@example.com
✅ JWT auth - Admin check result: true
Loaded users: { users: [...], total: 5 }
```

---

## User Data Structure

### From Cognito
```json
{
  "userId": "waseem-samra",
  "email": "waseem.samra@tcmiglobal.com",
  "enabled": true,
  "status": "CONFIRMED",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### From DynamoDB (if exists)
```json
{
  "firstName": "Waseem",
  "lastName": "Samra",
  "contact": "+1234567890",
  "role": "admin",
  "status": "active"
}
```

### Combined Response
```json
{
  "userId": "waseem-samra",
  "email": "waseem.samra@tcmiglobal.com",
  "firstName": "Waseem",
  "lastName": "Samra",
  "contact": "+1234567890",
  "role": "admin",
  "status": "active",
  "enabled": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Testing

### 1. Test List Users
```bash
# Login as admin and get token
# Then:
curl https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should see ALL users from Cognito
```

### 2. Test Delete User
```bash
curl -X DELETE "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/test-user" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test in Browser
1. Login as admin: `http://localhost:4173/admin/login`
2. Go to Users: `http://localhost:4173/admin/users`
3. Should see ALL registered users
4. Try deleting a user

---

## Troubleshooting

### "Unauthorized" Error
- Verify JWT token is valid
- Check admin email matches: `waseemsamra@gmail.com` or `admin@fashionstore.com`
- Token must not be expired

### "Access Denied" on Cognito
- Check IAM role has Cognito permissions
- Verify User Pool ID is correct: `us-east-1_MjEc3MXcK`

### Users Not Showing
- Check Cognito User Pool has users
- Verify API is deployed
- Check CloudWatch logs for errors

### Delete Fails
- Check user exists in Cognito
- Verify IAM has `cognito-idp:AdminDeleteUser` permission

---

## Current Status

✅ Lambda updated with Cognito integration
✅ IAM permissions added for Cognito
✅ Frontend already supports CRUD
✅ Admin auth working with JWT
✅ Delete removes from Cognito + DynamoDB
✅ Edit updates DynamoDB profile

**After Deployment:**
- ✅ Admin sees ALL users from Cognito
- ✅ Can delete users (removes from Cognito)
- ✅ Can edit user profiles
- ✅ Can create new users

---

## Files Modified

- ✅ `fashion-store-stack.yaml` - Lambda code + Cognito permissions
- ✅ `src/services/auth.ts` - Profile creation on signin
- ✅ `src/pages/user/Login.tsx` - Profile creation on verification
- ✅ `src/pages/admin/Users.tsx` - Full CRUD support
- ✅ `src/services/api.ts` - User CRUD methods
- ✅ `src/components/admin/AdminLayout.tsx` - JWT auth check
- ✅ `src/utils/auth.ts` - Admin access check

---

**App running at:** `http://localhost:4173`

**Deploy the stack and admin will see ALL users!**
