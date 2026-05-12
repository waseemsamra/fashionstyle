import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// UserDashboard component - redirects to ProfilePage
// The app correctly routes to ProfilePage which uses AuthContext and proper hooks

export default function UserDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the correct profile page
    navigate('/profile', { replace: true });
  }, []);

  return (
    <div className="min-h-screen bg-beige-100 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Redirecting to Profile...</h2>
        <p className="text-gray-600">Please wait while we redirect you to the updated profile page.</p>
      </div>
    </div>
  );
}
