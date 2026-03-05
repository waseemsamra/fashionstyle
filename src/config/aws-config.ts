import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_OAUTH_DOMAIN || '',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_OAUTH_REDIRECT_SIGN_IN || 'http://localhost:5173/'],
          redirectSignOut: [import.meta.env.VITE_OAUTH_REDIRECT_SIGN_OUT || 'http://localhost:5173/'],
          responseType: 'code'
        }
      }
    }
  }
});

export default Amplify;
