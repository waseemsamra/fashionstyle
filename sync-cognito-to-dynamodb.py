#!/usr/bin/env python3
import boto3
import json
from datetime import datetime

# Configuration
USER_POOL_ID = "us-east-1_MqsmTDkkg"
DYNAMODB_TABLE = "fashionstore-users"
REGION = "us-east-1"

# Initialize clients
cognito = boto3.client('cognito-idp', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(DYNAMODB_TABLE)

def get_cognito_users():
    """Fetch all users from Cognito"""
    users = []
    pagination_token = None
    
    while True:
        params = {
            'UserPoolId': USER_POOL_ID,
            'Limit': 60
        }
        if pagination_token:
            params['PaginationToken'] = pagination_token
            
        response = cognito.list_users(**params)
        users.extend(response['Users'])
        
        if 'PaginationToken' in response:
            pagination_token = response['PaginationToken']
        else:
            break
    
    return users

def main():
    print(f"🔄 Syncing users from Cognito ({USER_POOL_ID}) to DynamoDB ({DYNAMODB_TABLE})\n")
    
    # Get Cognito users
    cognito_users = get_cognito_users()
    print(f"📋 Found {len(cognito_users)} users in Cognito\n")
    
    # Create DynamoDB users
    created = 0
    for user in cognito_users:
        username = user['Username']
        attributes = {attr['Name']: attr['Value'] for attr in user.get('Attributes', [])}
        email = attributes.get('email', username)
        
        # Create user record with email as primary key
        user_item = {
            'email': email,
            'userId': username,
            'cognitoSub': username,
            'name': attributes.get('name', ''),
            'firstName': attributes.get('name', '').split()[0] if attributes.get('name') else '',
            'lastName': ' '.join(attributes.get('name', '').split()[1:]) if attributes.get('name') else '',
            'contact': '',
            'phone': attributes.get('phone_number', ''),
            'address': '',
            'city': '',
            'postalCode': '',
            'role': 'admin' if email == 'waseemsamra@gmail.com' else 'customer',
            'status': 'active',
            'enabled': user.get('Enabled', True),
            'cognitoStatus': user.get('UserStatus', 'UNKNOWN'),
            'createdAt': str(user.get('UserCreateDate', datetime.utcnow().isoformat())),
            'updatedAt': str(user.get('UserLastModifiedDate', datetime.utcnow().isoformat())),
        }
        
        # Add to DynamoDB
        table.put_item(Item=user_item)
        print(f"  ✅ Created/Updated: {email} ({user_item['role']})")
        created += 1
    
    print(f"\n✅ Sync complete! Created/Updated {created} users in DynamoDB")
    print(f"\n📊 Users synced:")
    for user in cognito_users:
        attributes = {attr['Name']: attr['Value'] for attr in user.get('Attributes', [])}
        email = attributes.get('email', user['Username'])
        print(f"   - {email}")

if __name__ == "__main__":
    main()
