// services/lambdaClient.ts
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

// AWS Configuration
const AWS_REGION = 'us-east-1';
const IDENTITY_POOL_ID = 'us-east-1:a5f3b7a9-0cd4-4af7-9beb-e27fea219927'; // Your existing identity pool
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID || 'us-east-1_MqsmTDkkg';

// Lambda Function Names
export const LAMBDA_FUNCTIONS = {
  PRODUCTS: 'fashionstore-universal-products',
  BRANDS: 'fashionstore-universal-brands',
  ORDERS: 'fashionstore-universal-orders',
  USERS: 'fashionstore-universal-users',
  ADMIN: 'fashionstore-universal-admin',
};

// Create Lambda client with Cognito credentials
let lambdaClient: LambdaClient | null = null;

export const getLambdaClient = async (): Promise<LambdaClient> => {
  if (lambdaClient) {
    return lambdaClient;
  }

  // Get ID token from localStorage (API Gateway expects ID Token)
  const idToken = localStorage.getItem('idToken') || localStorage.getItem('jwt_token');
  
  // Use Cognito Identity Pool for credentials
  const credentials = fromCognitoIdentityPool({
    identityPoolId: IDENTITY_POOL_ID,
    clientConfig: { region: AWS_REGION },
    logins: {
      [`cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken || '',
    },
  });

  lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: await credentials(),
  });

  return lambdaClient;
};

// Invoke Lambda function
export const invokeLambda = async (
  functionName: string,
  payload: any
): Promise<any> => {
  try {
    console.log(`🔮 Invoking Lambda: ${functionName}`);
    
    const client = await getLambdaClient();
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    });

    const response = await client.send(command);
    
    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      console.log(`✅ Lambda response:`, result);
      return result;
    }
    
    throw new Error('No payload in Lambda response');
  } catch (error: any) {
    console.error(`❌ Lambda invocation error:`, error);
    throw error;
  }
};

// Helper to create API Gateway-style event
export const createLambdaEvent = (
  httpMethod: string,
  path: string,
  pathParameters?: any,
  queryStringParameters?: any,
  body?: any
) => {
  // Use ID Token for API Gateway
  const idToken = localStorage.getItem('idToken') || localStorage.getItem('jwt_token');
  const email = localStorage.getItem('user_email') || '';
  
  return {
    httpMethod,
    path,
    pathParameters,
    queryStringParameters,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    requestContext: {
      authorizer: {
        claims: {
          email,
          'cognito:username': email,
        },
      },
    },
  };
};
