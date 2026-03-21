# User Management Setup Guide

## Overview

This guide will help you set up complete user management functionality in your admin panel, integrated with AWS Cognito and DynamoDB.

## Features

### ✅ Admin User Management Capabilities:

1. **View All Users** - List all users from Cognito + DynamoDB profiles
2. **Create New User** - Add users manually with email, name, role, etc.
3. **Edit User** - Update user information (name, email, address, role, status)
4. **Delete User** - Remove users from both Cognito and DynamoDB
5. **Search & Filter** - Find users by email, name, role, or status

## Architecture

```
Admin Panel (React)
    ↓
API Gateway (HTTPS)
    ↓
Lambda Function (userManagement.js)
    ↓
├── Cognito (Authentication)
└── DynamoDB (User Profiles)
```

## Setup Steps

### Step 1: Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name fashionstore-users \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --key-schema AttributeName=email,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 2: Deploy Lambda Function

Run the deployment script:

```bash
./deploy-user-api.sh
```

This script will:
1. Create IAM role for Lambda
2. Package and upload Lambda function
3. Create API Gateway endpoints
4. Configure CORS
5. Deploy to production stage

### Step 3: Update Frontend Configuration

After deployment, update your `.env` file:

```bash
VITE_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod
```

### Step 4: Test the API

```bash
# Get all users
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/admin/users

# Create user
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"customer"}' \
  https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/admin/users
```

## Admin Credentials

### Current Admin User:

- **Email**: `waseemsamra@gmail.com`
- **Password**: `Admin@123`

⚠️ **Important**: Change the password after first login!

### Create Additional Admin Users:

```bash
# Run the create-admin script
./create-admin.sh

# Or manually set password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --password 'YourNewPassword123!' \
  --permanent \
  --region us-east-1
```

## Using the User Management Panel

### Access the Panel:

1. Go to: `http://localhost:5173/admin/users`
2. Login with admin credentials
3. You'll see the user list

### Create New User:

1. Click **"Add User"** button
2. Fill in the form:
   - Name (required)
   - Email (required)
   - First Name
   - Last Name
   - Phone/Contact
   - Address
   - City
   - Postal Code
   - Role (Customer or Admin)
   - Status (Active, Inactive, Pending)
3. Click **"Create User"**

### Edit User:

1. Click the **Edit** (pencil) icon next to user
2. Update any fields
3. Click **"Update User"**

### Delete User:

1. Click the **Delete** (trash) icon
2. Confirm deletion
3. User is removed from Cognito and DynamoDB

## API Endpoints

### GET /admin/users
List all users

**Response:**
```json
{
  "users": [
    {
      "userId": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "status": "active",
      "enabled": true,
      "cognitoStatus": "CONFIRMED",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /admin/users
Create new user

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "customer",
  "status": "active"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "userId": "user-uuid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "customer",
    "status": "active"
  },
  "temporaryPassword": "Temp@123456"
}
```

### GET /admin/users/:userId
Get single user by ID

### PUT /admin/users/:userId
Update user information

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin",
  "status": "active",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "postalCode": "10001"
}
```

### DELETE /admin/users/:userId
Delete user (from Cognito and DynamoDB)

## Files Created

### Backend (AWS Lambda):
- `lambda/userManagement.js` - Lambda function code
- `deploy-user-api.sh` - Deployment script

### Frontend (React):
- `src/pages/admin/Users.tsx` - User management UI (already exists)
- `src/services/api.ts` - API client methods (already configured)

## Troubleshooting

### "Unauthorized" Error

**Problem**: API returns 401 Unauthorized

**Solution**:
1. Check if you're logged in as admin
2. Verify JWT token is valid
3. Token might be expired - login again

### "User Not Found" Error

**Problem**: API returns 404

**Solution**:
1. Check if user exists in Cognito
2. Verify user ID is correct
3. Check AWS region matches

### Lambda Function Fails

**Problem**: Deployment script fails

**Solution**:
1. Check AWS credentials are configured: `aws configure`
2. Verify you have necessary permissions
3. Check CloudWatch Logs for Lambda errors

### CORS Error

**Problem**: Browser shows CORS error

**Solution**:
1. Ensure API Gateway has CORS enabled
2. Check `Access-Control-Allow-Origin` header
3. Re-run deployment script

## Monitoring

### View Lambda Logs:

```bash
aws logs tail /aws/lambda/user-management-api --follow
```

### Check API Gateway Metrics:

1. Go to AWS Console → API Gateway
2. Select your API
3. Click "Monitoring" tab

### View DynamoDB Items:

```bash
aws dynamodb scan --table-name fashionstore-users
```

## Security Best Practices

1. **Change Default Password**: Update admin password immediately
2. **Use HTTPS**: Always use HTTPS in production
3. **Token Expiration**: Set short token expiration times
4. **Role-Based Access**: Only admins can manage users
5. **Audit Logs**: Enable CloudTrail for API auditing

## Next Steps

1. ✅ Deploy Lambda function
2. ✅ Test API endpoints
3. ✅ Update `.env` with new API URL
4. ✅ Test user management in admin panel
5. ✅ Create additional admin users if needed
6. ✅ Set up monitoring and alerts

## Support

If you encounter issues:
1. Check CloudWatch Logs for Lambda errors
2. Review API Gateway test console
3. Verify Cognito user pool configuration
4. Check DynamoDB table exists and has correct schema
