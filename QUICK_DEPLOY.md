# Quick Deploy Guide - Collections Lambda

## One Command to Deploy

```bash
./deploy-collections-lambda.sh
```

## Before Running

### 1. Install AWS CLI (if not installed)
```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

### 2. Configure AWS Credentials
```bash
aws configure
```
Enter:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-east-1`
- Default output format: `json`

### 3. Update Script Configuration (if needed)

Open `deploy-collections-lambda.sh` and check these values at the top:

```bash
REGION="us-east-1"                          # Your AWS region
LAMBDA_NAME="fashionstore-collections"      # Lambda function name
TABLE_NAME="fashionstore-data"              # Your DynamoDB table
LAMBDA_ROLE_NAME="fashionstore-lambda-role" # Update with your Lambda role name!
API_ID="rvtv0snm8k"                         # Your API Gateway ID
API_STAGE="prod"                            # API Gateway stage
```

**IMPORTANT:** Update `LAMBDA_ROLE_NAME` with your existing Lambda execution role name.

To find your role name:
```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `fashionstore`)].RoleName' --output table
```

## Run the Script

```bash
cd /Users/apple/Downloads/fashionstyle
./deploy-collections-lambda.sh
```

## What It Does

1. ✅ Checks AWS CLI and credentials
2. ✅ Zips Lambda code
3. ✅ Creates/updates Lambda function
4. ✅ Adds DynamoDB permissions
5. ✅ Adds API Gateway invoke permissions
6. ✅ Creates API Gateway resources (`/collections`)
7. ✅ Adds GET, POST, DELETE, OPTIONS methods
8. ✅ Deploys API
9. ✅ Tests endpoints

## After Deployment

### Test Collections API
```bash
# List all collections
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections"

# Get specific collection
curl "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections/featuredCollection"

# Create a test collection
curl -X POST "https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod/collections/test" \
  -H "Content-Type: application/json" \
  -d '{"productIds": ["prod-1"], "displayName": "Test"}'
```

### Monitor Logs
```bash
aws logs tail /aws/lambda/fashionstore-collections --follow
```

### Redeploy After Changes
```bash
# Just run the script again - it will update existing resources
./deploy-collections-lambda.sh
```

## Troubleshooting

### "AWS CLI not found"
```bash
brew install awscli
```

### "AWS credentials not configured"
```bash
aws configure
```

### "Role not found"
Find your existing Lambda role:
```bash
aws iam list-roles --query 'Roles[].RoleName' --output text | tr '\t' '\n' | grep -i lambda
```
Update `LAMBDA_ROLE_NAME` in the script with the correct name.

### "API not found"
Check your API Gateway ID:
```bash
aws apigateway get-rest-apis --query 'items[].{ID:id,Name:name}' --output table
```
Update `API_ID` in the script.

## What Gets Created

| Resource | Name | Purpose |
|----------|------|---------|
| Lambda | `fashionstore-collections` | Collections API backend |
| API Route | `/collections` | List all collections |
| API Route | `/collections/{name}` | Get/Save/Delete collections |
| IAM Policy | `fashionstore-collections-policy` | DynamoDB permissions |

All in your existing `fashionstore-data` DynamoDB table.

## Cost

**Free tier eligible!**
- Lambda: 1M free requests/month
- API Gateway: 1M free requests/month
- DynamoDB: Same table (no new table cost)

**Estimated cost: $0/month** (within free tier)
