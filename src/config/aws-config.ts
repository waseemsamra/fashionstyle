import { Amplify } from 'aws-amplify';

// Configure Amplify with GraphQL (AppSync)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
    }
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_GRAPHQL_URL || 'https://5wclz64wkfgp3h3exivmggigvu.appsync-api.us-east-1.amazonaws.com/graphql',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'apiKey' as any,
      apiKey: import.meta.env.VITE_GRAPHQL_API_KEY || 'da2-aadwbwrozrfgriafn6pgjjhrca',
    },
  },
});

export default Amplify;
