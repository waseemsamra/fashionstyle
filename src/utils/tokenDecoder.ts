// utils/tokenDecoder.ts

export interface DecodedToken {
  email: string;
  name?: string;
  role?: string;
  sub: string; // User ID
  exp: number; // Expiration
  iat: number; // Issued at
  iss: string; // Issuer
}

export function decodeJWT(token: string): DecodedToken | null {
  try {
    if (!token) return null;

    // JWT has 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);

    // Cognito stores email in different claims
    const email = parsed.email || 
                  parsed['cognito:username'] || 
                  parsed['email'] ||
                  parsed['username'] ||
                  'user@example.com';

    return {
      email: email,
      name: parsed.name || parsed['cognito:username'] || email.split('@')[0] || 'User',
      role: parsed.role || parsed['custom:role'] || 'admin', // Default to admin for now
      sub: parsed.sub,
      exp: parsed.exp,
      iat: parsed.iat,
      iss: parsed.iss,
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded) return true;
  
  // Check if token expires in less than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now + 300;
}

export function getUserFromToken(token: string) {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
    createdAt: new Date(decoded.iat * 1000).toISOString(),
  };
}
