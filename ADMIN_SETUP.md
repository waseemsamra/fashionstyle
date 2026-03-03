# 🔐 Admin User Setup with Groups

## Admin Credentials

**Email**: waseemsamra@gmail.com  
**Temporary Password**: Admin@123  
**Group**: Admins

## Setup Instructions

### Option 1: Using AWS CLI (Recommended)

Run the provided script:
```bash
./create-admin.sh
```

This will:
1. ✅ Create "Admins" group in Cognito
2. ✅ Create user waseemsamra@gmail.com
3. ✅ Add user to Admins group

### Option 2: Manual AWS CLI Commands

```bash
# 1. Create Admin Group
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id us-east-1_qavi3JAVz \
  --description "Administrator group with full access" \
  --region us-east-1

# 2. Create Admin User
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --user-attributes Name=email,Value=waseemsamra@gmail.com Name=email_verified,Value=true \
  --temporary-password "Admin@123" \
  --message-action SUPPRESS \
  --region us-east-1

# 3. Add User to Admin Group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --group-name Admins \
  --region us-east-1
```

### Option 3: Using AWS Console

1. Go to AWS Console → Cognito
2. Select User Pool: `us-east-1_qavi3JAVz`
3. **Create Group**:
   - Click "Groups" tab
   - Click "Create group"
   - Name: `Admins`
   - Description: `Administrator group with full access`
   - Click "Create group"
4. **Create User**:
   - Click "Users" tab
   - Click "Create user"
   - Email: `waseemsamra@gmail.com`
   - Temporary password: `Admin@123`
   - Mark email as verified
   - Click "Create user"
5. **Add to Group**:
   - Click on the user
   - Click "Add user to group"
   - Select "Admins"
   - Click "Add"

## First Login

1. Go to: http://localhost:5173/admin/login (or your deployed URL)
2. Enter:
   - Email: `waseemsamra@gmail.com`
   - Password: `Admin@123`
3. You'll be prompted to set a new password
4. Enter new password (min 8 chars, uppercase, lowercase, number, special char)
5. Access dashboard!

## Role-Based Access Control

The dashboard now checks for "Admins" group membership:
- ✅ Users in "Admins" group → Full access
- ❌ Users NOT in "Admins" group → Access denied

## Add More Admins

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_qavi3JAVz \
  --username newadmin@example.com \
  --user-attributes Name=email,Value=newadmin@example.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS \
  --region us-east-1

# Add to Admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_qavi3JAVz \
  --username newadmin@example.com \
  --group-name Admins \
  --region us-east-1
```

## Remove Admin Access

```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_qavi3JAVz \
  --username user@example.com \
  --group-name Admins \
  --region us-east-1
```

## Check User Groups

```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --region us-east-1
```

## List All Admins

```bash
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_qavi3JAVz \
  --group-name Admins \
  --region us-east-1
```

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## Troubleshooting

### User already exists
```bash
# Delete existing user
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --region us-east-1

# Then create again
./create-admin.sh
```

### Reset password
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --password 'NewPassword123!' \
  --permanent \
  --region us-east-1
```

### Check user status
```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_qavi3JAVz \
  --username waseemsamra@gmail.com \
  --region us-east-1
```

## Admin Dashboard Access

Once logged in, you'll have access to:
- ✅ Dashboard Overview
- ✅ Products Management
- ✅ Orders Management
- ✅ Customers Management
- ✅ Brands Management
- ✅ Settings (Categories, Colors, Materials, Sizes, etc.)

---

**🎉 Admin login with AWS Cognito is now ready!**
