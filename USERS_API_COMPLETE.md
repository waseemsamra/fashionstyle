# Users API - Complete CRUD Operations

## API Endpoints

Base URL: `https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod`

All endpoints require JWT token in Authorization header with **admin** role.

### 1. List All Users
```bash
curl -X GET "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "userId": "john",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "contact": "+1234567890",
      "role": "customer",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### 2. Search Users by Email
```bash
curl -X GET "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users?email=gmail" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Single User
```bash
curl -X GET "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/admin-waseem-1772765682" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "user": {
    "userId": "admin-waseem-1772765682",
    "email": "waseemsamra@gmail.com",
    "firstName": "Waseem",
    "lastName": "Samra",
    "role": "admin",
    "status": "active"
  }
}
```

### 4. Create User
```bash
curl -X POST "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "role": "customer",
    "status": "active"
  }'
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "userId": "newuser",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "customer",
    "status": "active"
  }
}
```

### 5. Update User
```bash
curl -X PUT "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/user-id-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "role": "admin",
    "status": "active"
  }'
```

**Response:**
```json
{
  "message": "User updated successfully",
  "userId": "user-id-here"
}
```

### 6. Delete User
```bash
curl -X DELETE "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/user-id-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "User deleted successfully",
  "userId": "user-id-here"
}
```

---

## Authentication

### JWT Token Requirements

- Token must be valid and not expired
- Token must contain `role: "admin"` OR `email: "admin@fashionstore.com"`
- Token is stored in `localStorage.jwt_token` after admin login

### Admin Login

Admins login through the standard login flow. The system checks:
1. Email matches `admin@fashionstore.com` OR
2. JWT token contains `role: "admin"`

### Getting Admin Token

```bash
# Login as admin
curl -X POST "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fashionstore.com",
    "password": "admin-password"
  }'

# Response includes accessToken
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
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

### Update Lambda Code Only

If stack is already deployed and you just want to update Lambda code:

1. Go to AWS Lambda Console
2. Find function: `fashionstore-prod-get-users-prod`
3. Click "Upload from" → ".zip file" OR edit code inline
4. Deploy

---

## DynamoDB Structure

Table: `fashionstore-prod`

```
Partition Key (PK)          | Sort Key (SK)  | Data
----------------------------|----------------|------------------
USER#john                   | PROFILE        | {email, firstName, lastName, role, status, ...}
USER#jane                   | PROFILE        | {email, firstName, lastName, role, status, ...}
```

### User Profile Schema

```typescript
{
  PK: string;          // USER#{userId}
  SK: string;          // PROFILE
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    contact?: string;
    role: 'customer' | 'admin';
    status: 'active' | 'inactive';
  };
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 400 Bad Request
```json
{
  "error": "No fields to update"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message details"
}
```

---

## Frontend Usage

### In React Components

```typescript
import { api } from '@/services/api';

// List all users
const users = await api.getUsers();

// Get single user
const user = await api.getUser('john');

// Create user
const result = await api.createUser({
  email: 'new@example.com',
  name: 'New User',
  role: 'customer',
  status: 'active'
});

// Update user
await api.updateUser('john', {
  role: 'admin'
});

// Delete user
await api.deleteUser('john');
```

---

## Testing

### Test with curl

```bash
# Set your token
export TOKEN="your-jwt-token-here"

# List users
curl -X GET "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users" \
  -H "Authorization: Bearer $TOKEN"

# Create user
curl -X POST "https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test User","role":"customer","status":"active"}'
```

### Test in Browser

1. Login as admin at `http://localhost:4173/admin/login`
2. Navigate to `http://localhost:4173/admin/users`
3. You should see the list of users
4. Try adding, editing, or deleting users

---

## Files Modified

- ✅ `fashion-store-stack.yaml` - Complete Users API with CRUD
- ✅ `src/services/api.ts` - API client methods
- ✅ `src/pages/admin/Users.tsx` - Admin UI for user management
- ✅ `src/services/api.ts` - JWT token interceptor

---

## Troubleshooting

### 1. "Unauthorized" Error
- Verify JWT token is valid
- Check token hasn't expired
- Ensure admin email or role is set correctly

### 2. "User not found" Error
- Verify userId exists in DynamoDB
- Check table name is `fashionstore-prod`

### 3. CORS Error
- Verify OPTIONS method is configured in API Gateway
- Check API Gateway deployment is complete

### 4. No Users Showing
- Verify users have signed up
- Check DynamoDB for `USER#*` items
- Test Lambda function directly in CloudWatch

---

## Next Steps

1. **Deploy the stack** using AWS CLI or Console
2. **Test the API** with curl commands
3. **Login as admin** and visit `/admin/users`
4. **Manage users** through the admin interface
