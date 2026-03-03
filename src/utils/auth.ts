import { fetchAuthSession } from 'aws-amplify/auth';

export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] || [];
    return groups.includes('Admins');
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
