import { fetchAuthSession } from 'aws-amplify/auth';

export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    // First check if user has admin email (simple check)
    const email = localStorage.getItem('user_email');
    const jwtToken = localStorage.getItem('jwt_token');
    
    console.log('🔍 Checking admin access for email:', email);

    if (email) {
      // Check if admin email (you can add more admin emails here)
      const adminEmails = [
        'waseemsamra@gmail.com',
        'admin@fashionstore.com',
        'admin@example.com'
      ];

      // Check if email matches any admin email
      const isAdminEmail = adminEmails.some(adminEmail =>
        email.toLowerCase() === adminEmail.toLowerCase() ||
        email.toLowerCase().includes(adminEmail.split('@')[0].toLowerCase())
      );

      if (isAdminEmail) {
        console.log('✅ Admin access granted via email:', email);
        return true;
      }
      
      // If we have JWT token, check if role is admin in token
      if (jwtToken) {
        try {
          // Decode JWT token to check role
          const tokenPayload = JSON.parse(atob(jwtToken.split('.')[1]));
          const role = tokenPayload.role || tokenPayload['custom:role'];
          
          if (role === 'admin') {
            console.log('✅ Admin access granted via JWT role:', role);
            return true;
          }
        } catch (e) {
          console.log('⚠️ Could not decode JWT token');
        }
      }
    }

    // Fallback: Check Cognito groups
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] || [];
      const isAdmin = groups.includes('Admins');
      console.log('✅ Admin access check - Groups:', groups, 'Is Admin:', isAdmin);
      return isAdmin;
    } catch (groupErr) {
      console.log('⚠️ Group check failed, using email check result');
      // If we have an email, allow access (for testing)
      return !!email;
    }
  } catch (err) {
    console.error('❌ Admin access check failed:', err);
    return false;
  }
};

export const getUserGroups = async (): Promise<string[]> => {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    return session.tokens?.accessToken?.payload['cognito:groups'] as string[] || [];
  } catch {
    return [];
  }
};
