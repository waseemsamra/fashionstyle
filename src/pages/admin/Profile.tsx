import { useState, useEffect } from 'react';
import { updatePassword } from 'aws-amplify/auth';
import { User, Lock, Mail, Calendar, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    whatsapp: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Load from localStorage (JWT auth)
      const email = localStorage.getItem('user_email') || '';
      const token = localStorage.getItem('jwt_token');
      
      if (email && token) {
        setUser({
          email: email,
          userId: email.replace(/[^a-zA-Z0-9]/g, '-'),
          signInDetails: { loginId: email }
        });
        
        // Try to load profile from API
        try {
          const response = await fetch(`https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/${email.replace(/[^a-zA-Z0-9]/g, '-')}/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.profile) {
              setProfile({
                firstName: data.profile.firstName || '',
                lastName: data.profile.lastName || '',
                contact: data.profile.contact || '',
                whatsapp: data.profile.whatsapp || '',
                address: data.profile.address || '',
                city: data.profile.city || '',
                postalCode: data.profile.postalCode || ''
              });
            }
          }
        } catch (err) {
          console.log('Profile load failed, using defaults');
        }
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load profile');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token') || '';
      const response = await fetch(`https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/users/${user.userId}/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          userId: user.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          contact: profile.contact,
          whatsapp: profile.whatsapp,
          email: user.email,
          address: profile.address,
          city: profile.city,
          postalCode: profile.postalCode
        })
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully');
        setEditMode(false);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.new.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await updatePassword({
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
      setMessage('Password changed successfully');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6" />
                <h3 className="text-xl font-bold">Profile Information</h3>
              </div>
              {!editMode ? (
                <Button onClick={() => setEditMode(true)} className="bg-gold hover:bg-gold/90">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setEditMode(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user?.email || user?.signInDetails?.loginId || 'Loading...'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                    disabled={!editMode}
                    className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                    disabled={!editMode}
                    className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Number</label>
                  <input
                    type="tel"
                    value={profile.contact}
                    onChange={(e) => setProfile({...profile, contact: e.target.value})}
                    disabled={!editMode}
                    className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={profile.whatsapp}
                    onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                    disabled={!editMode}
                    className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  disabled={!editMode}
                  className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({...profile, city: e.target.value})}
                    disabled={!editMode}
                    className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <input
                    type="text"
                    value={profile.postalCode}
                    onChange={(e) => setProfile({...profile, postalCode: e.target.value})}
                    disabled={!editMode}
                    className={`w-full p-3 border rounded-lg ${!editMode ? 'bg-gray-100' : ''}`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium">Administrator</p>
                </div>
              </div>
            </div>
          </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6" />
            <h3 className="text-xl font-bold">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                value={passwords.old}
                onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
