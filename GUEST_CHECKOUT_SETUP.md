# Guest Checkout Flow - Setup Guide

## Overview

This guide explains the complete guest checkout flow implementation:

1. **Guest user fills checkout form** with email, name, address
2. **System checks if user exists** - if yes, redirect to login
3. **Creates guest account** with temporary password
4. **Sends welcome email** with login credentials
5. **Completes order** as guest user
6. **User can login later** with sent credentials

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Guest Checkout Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. User adds items to cart → Clicks "Checkout"
                              ↓
2. Guest Checkout Form (no login required)
   - First Name, Last Name
   - Email
   - Phone
   - Address
                              ↓
3. Click "Place Order"
                              ↓
4. System checks if user exists
   ┌──────────────┬──────────────┐
   │   EXISTS     │   NEW USER   │
   └──────────────┴──────────────┘
         ↓                ↓
   Redirect to      Create guest
   Login with       account with
   checkout data    temp password
         ↓                ↓
   User logs in     Send welcome
         ↓          email with
   Complete         credentials
   checkout               ↓
         ↓          Create order
         └──────┬─────┘
                ↓
        Order Confirmation
                ↓
        Email with tracking
```

## Files Modified/Created

### Frontend
- `src/pages/checkout/Checkout.tsx` - Complete rewrite for guest checkout
- `src/pages/user/Login.tsx` - Updated to restore checkout data after login

### Backend
- `lambda-send-welcome-email.js` - Lambda function to send welcome emails

## Backend Setup

### 1. Deploy Welcome Email Lambda

```bash
# Create deployment package
cd /Users/apple/Downloads/fashionstyle
zip lambda-send-welcome-email.zip lambda-send-welcome-email.js

# Deploy to AWS Lambda
aws lambda create-function \
  --function-name SendWelcomeEmail \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda-send-welcome-email.handler \
  --zip-file fileb://lambda-send-welcome-email.zip \
  --region us-east-1

# Or update if exists
aws lambda update-function-code \
  --function-name SendWelcomeEmail \
  --zip-file fileb://lambda-send-welcome-email.zip \
  --region us-east-1
```

### 2. Configure SES (Simple Email Service)

```bash
# Verify your sender email
aws ses verify-email-identity \
  --email-address "noreply@yourdomain.com" \
  --region us-east-1

# Check verification status
aws ses get-identity-verification-attributes \
  --identities "noreply@yourdomain.com" \
  --region us-east-1
```

**Note:** SES must be in production mode (not sandbox) to send to unverified emails.

### 3. Add API Gateway Endpoint

Add this to your API Gateway configuration:

```yaml
# In your CloudFormation/SAM template
SendWelcomeEmailFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: SendWelcomeEmail
    Runtime: nodejs18.x
    Handler: lambda-send-welcome-email.handler
    Role: !GetAtt LambdaExecutionRole.Arn
    Code:
      S3Bucket: your-deployment-bucket
      S3Key: lambda-send-welcome-email.zip
    Environment:
      Variables:
        USERS_TABLE: !Ref UsersTable

SendWelcomeEmailApi:
  Type: AWS::ApiGateway::Resource
  Properties:
    RestApiId: !Ref ApiGateway
    ParentId: !GetAtt ApiGateway.RootResourceId
    PathPart: send-welcome-email

SendWelcomeEmailMethod:
  Type: AWS::ApiGateway::Method
  Properties:
    RestApiId: !Ref ApiGateway
    ResourceId: !Ref SendWelcomeEmailApi
    HttpMethod: POST
    AuthorizationType: NONE
    Integration:
      Type: AWS_PROXY
      IntegrationHttpMethod: POST
      Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SendWelcomeEmailFunction.Arn}/invocations

SendWelcomeEmailPermission:
  Type: AWS::Lambda::Permission
  Properties:
    FunctionName: !Ref SendWelcomeEmailFunction
    Action: lambda:InvokeFunction
    Principal: apigateway.amazonaws.com
    SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*
```

### 4. Update Lambda Permissions

```bash
# Allow API Gateway to invoke Lambda
aws lambda add-permission \
  --function-name SendWelcomeEmail \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:YOUR_ACCOUNT_ID:YOUR_API_ID/*/*" \
  --region us-east-1
```

## Frontend Configuration

The frontend is already configured. Just ensure:

1. API URL in `src/services/api.ts` points to your API Gateway
2. The endpoint `/send-welcome-email` is accessible

## Testing the Flow

### 1. Test Welcome Email

```bash
# Test the welcome email endpoint
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tempPassword": "TempPass123!"
  }'
```

### 2. Test Complete Flow

1. Add items to cart
2. Go to checkout (`/checkout`)
3. Fill in guest details
4. Click "Place Order"
5. Check email for welcome message
6. Verify order confirmation page

### 3. Test Existing User Redirect

1. Use an email that already exists in the system
2. Fill checkout form
3. Click "Place Order"
4. Should redirect to login page
5. Login with credentials
6. Should return to checkout with data preserved

## Security Considerations

### Temporary Password Generation
- 12 characters with uppercase, lowercase, numbers, symbols
- Randomly shuffled for security
- One-time use (user must change on first login)

### Guest Account Flags
- `isGuest: true` - Marks account as guest-created
- `isGuestOrder: true` - Marks order as guest order

### Email Verification
- Welcome email includes password change reminder
- Link to login page provided
- Temporary password should be changed on first login

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users/{userId}` | GET | Check if user exists |
| `/users` | POST | Create guest user |
| `/users/{userId}/profile` | PUT | Create user profile |
| `/send-welcome-email` | POST | Send welcome email |
| `/users/{userId}/orders` | POST | Create order |

## Next Steps

1. Deploy welcome email Lambda
2. Configure SES for sending emails
3. Add API Gateway endpoint
4. Test complete flow
5. Monitor CloudWatch logs
