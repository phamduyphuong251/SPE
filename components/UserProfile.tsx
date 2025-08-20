import React, { useState, useEffect, FC } from 'react';
import { supabase } from '../constants';
import { Spinner } from './icons';
import Modal from './Modal';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setNewEmail(user?.email || '');
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    setError(null);
    setMessage(null);

    try {
      const updateData: any = {};
      
      if (newEmail && newEmail !== user?.email) {
        updateData.email = newEmail;
      }
      
      if (newPassword.trim()) {
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage('No changes to update');
        setUpdating(false);
        return;
      }

      const { data, error } = await supabase.auth.updateUser(updateData);
      
      if (error) {
        setError(error.message);
      } else {
        setMessage('Profile updated successfully!');
        setUser(data.user);
        setNewPassword('');
        await loadUserProfile();
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Update profile error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
        <div className="flex justify-center items-center h-32">
          <Spinner className="w-8 h-8 text-brand-primary" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      <div className="space-y-6">
        {/* Current User Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-brand-text mb-3">Current Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">User ID:</span> {user?.id}</p>
            <p><span className="font-medium">Created:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            <p><span className="font-medium">Last Sign In:</span> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Update Form */}
        <div>
          <h3 className="text-lg font-medium text-brand-text mb-3">Update Profile</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">New Email</label>
              <input
                type="email"
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                placeholder="Enter new email"
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                placeholder="Enter new password (leave blank to keep current)"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}

            <div className="flex justify-end">
              <button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="px-4 py-2 font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-opacity-50 flex items-center"
              >
                {updating ? <Spinner className="w-5 h-5 mr-2" /> : null}
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfile; 