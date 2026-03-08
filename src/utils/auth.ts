import { fetchAuthSession } from 'aws-amplify/auth';

export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    // First check if user has admin email (simple check)
    const email = localStorage.getItem('user_email');
    console.log('🔍 Checking admin access for email:', email);
    
    if (email) {
      // Check if admin email (you can add more admin emails here)
      const adminEmails = [
        'waseemsamra@gmail.com',
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
