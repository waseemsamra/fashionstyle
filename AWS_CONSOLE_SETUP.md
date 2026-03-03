# 🖥️ AWS Console Setup Guide - Admin User & Group

## Step-by-Step Instructions

### Step 1: Open AWS Cognito Console

1. Go to AWS Console: https://console.aws.amazon.com
2. Search for "Cognito" in the search bar
3. Click on "Cognito" service
4. Click on "User pools"
5. Find and click on your User Pool: `us-east-1_qavi3JAVz`

---

### Step 2: Create Admin Group

1. In the left sidebar, click **"Groups"**
2. Click **"Create group"** button
3. Fill in the form:
   - **Group name**: `Admins`
   - **Description**: `Administrator group with full access`
   - **Precedence**: Leave as `0` (optional)
   - **IAM role**: Leave empty (optional)
4. Click **"Create group"**

✅ Admin group created!

---

### Step 3: Create Admin User

1. In the left sidebar, click **"Users"**
2. Click **"Create user"** button
3. Fill in the form:
   - **User name**: `waseemsamra@gmail.com`
   - **Email address**: `waseemsamra@gmail.com`
   - **Mark email address as verified**: ✅ Check this box
   - **Temporary password**: Select "Set a password"
   - **Password**: `Admin@123`
   - **Send an email invitation**: ❌ Uncheck this
4. Click **"Create user"**

✅ Admin user created!

---

### Step 4: Add User to Admin Group

1. Stay on the **"Users"** page
2. Click on the user: `waseemsamra@gmail.com`
3. Scroll down to the **"Group memberships"** section
4. Click **"Add user to group"** button
5. Select the checkbox next to **"Admins"**
6. Click **"Add"** button

✅ User added to Admins group!

---

## Verification

### Check User Details:
1. Click on user: `waseemsamra@gmail.com`
2. Verify:
   - ✅ Email is verified
   - ✅ User status is "FORCE_CHANGE_PASSWORD" or "CONFIRMED"
   - ✅ Group memberships shows "Admins"

### Check Group Members:
1. Go to **"Groups"** in left sidebar
2. Click on **"Admins"** group
3. Verify user `waseemsamra@gmail.com` is listed

---

## Login to Dashboard

1. Open your app: http://localhost:5173/admin/login
2. Enter credentials:
   - **Email**: `waseemsamra@gmail.com`
   - **Password**: `Admin@123`
3. If prompted, set a new password:
   - Must be at least 8 characters
   - Must contain uppercase, lowercase, number, special character
   - Example: `MyNewPass123!`
4. Click "Login"

✅ You're now logged into the admin dashboard!

---

## Optional: Set Permanent Password (Skip Password Change)

If you want to set a permanent password without forcing user to change it:

1. Go to **"Users"** → Click on `waseemsamra@gmail.com`
2. Click **"Actions"** dropdown → Select **"Set password"**
3. Enter new password: `YourPassword123!`
4. ✅ Check **"Set password as permanent"**
5. Click **"Set password"**

---

## Add More Admins (Repeat Steps 3-4)

To add another admin user:
1. Create user (Step 3)
2. Add to Admins group (Step 4)

---

## Remove Admin Access

1. Go to **"Users"** → Click on user
2. Scroll to **"Group memberships"**
3. Select **"Admins"** group
4. Click **"Remove from group"**

---

## Troubleshooting

### User can't login?
- Check email is verified
- Check user status is "CONFIRMED"
- Check user is in "Admins" group

### "Access denied" message?
- User must be in "Admins" group
- Check group membership in Cognito Console

### Forgot password?
1. Go to Users → Click user
2. Actions → Reset password
3. Set new temporary password

---

## Quick Reference

**User Pool ID**: `us-east-1_qavi3JAVz`  
**Group Name**: `Admins`  
**Admin Email**: `waseemsamra@gmail.com`  
**Temp Password**: `Admin@123`

---

✅ **Setup complete! You can now login to the admin dashboard.**
