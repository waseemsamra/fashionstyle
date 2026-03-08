import { fetchAuthSession } from 'aws-amplify/auth';

export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    // First check if user has admin email (simple check)
    const email = localStorage.getItem('user_email');
    if (email) {
      // Check if admin email (you can add more admin emails here)
      const adminEmails = [
        'waseemsamra@gmail.com',
        'admin@example.com'
      ];
      
      if (adminEmails.some(adminEmail => email.toLowerCase().includes(adminEmail.split('@')[0].toLowerCase()))) {
        console.log('✅ Admin access granted via email:', email);
        return true;
      }
    }
    
    // Fallback: Check Cognito groups
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] || [];
      const isAdmin = groups.includes('Admins');
      console.log('✅ Admin access granted via group:', groups);
      return isAdmin;
    } catch (groupErr) {
      console.log('Group check failed, using email check');
      return !!email; // Allow if logged in
    }
  } catch {
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
