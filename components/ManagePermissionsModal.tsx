import React, { useState, useEffect, useCallback, FC } from 'react';
import { useMsal } from '@azure/msal-react';
import Modal from './Modal';
import { Spinner, ShareIcon } from './icons';
import { getPermissions, inviteUser, revokePermission } from '../services/graphService';
import { DriveItem, Permission } from '../types';

interface ManagePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveId: string;
  item: DriveItem;
}

const ManagePermissionsModal: FC<ManagePermissionsModalProps> = ({ isOpen, onClose, driveId, item }) => {
  const { instance, accounts } = useMsal();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'read' | 'write'>('read');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [removingId, setRemovingId] = useState<string | null>(null);
  
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const perms = await getPermissions(instance, accounts[0], driveId, item.id);
      // Filter for permissions granted to users, not applications or other principals
      setPermissions(perms.filter(p => p.grantedToV2?.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [instance, accounts, driveId, item.id]);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, loadPermissions]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsInviting(true);
    setInviteError(null);
    try {
      await inviteUser(instance, accounts[0], driveId, item.id, email, role);
      setEmail('');
      setRole('read');
      await loadPermissions(); // Refresh list
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to grant access');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (permissionId: string) => {
    setRemovingId(permissionId);
    try {
      await revokePermission(instance, accounts[0], driveId, item.id, permissionId);
      await loadPermissions();
    } catch (err) {
      alert('Failed to revoke permission: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Access: ${item.name}`}>
      <div className="space-y-6">
        {/* Grant Access Form */}
        <div>
          <h3 className="text-lg font-medium text-brand-text mb-2 flex items-center"><ShareIcon className="mr-2"/>Grant Access</h3>
          <form onSubmit={handleGrantAccess} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              required
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'read' | 'write')}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value="read">Can view</option>
              <option value="write">Can edit</option>
            </select>
            <button type="submit" disabled={isInviting} className="w-full sm:w-auto px-4 py-2 font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-opacity-50 flex justify-center items-center">
              {isInviting ? <Spinner className="w-5 h-5" /> : 'Grant'}
            </button>
          </form>
          {inviteError && <p className="text-sm text-red-500 mt-2">{inviteError}</p>}
        </div>

        {/* Permissions List */}
        <div>
          <h3 className="text-lg font-medium text-brand-text mb-2">People with access</h3>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Spinner className="w-8 h-8 text-brand-primary" />
            </div>
          ) : error ? (
            <div className="text-red-500 bg-red-50 p-3 rounded-md">{error}</div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-brand-border rounded-lg">
              <ul className="divide-y divide-brand-border">
                {permissions.length === 0 ? (
                  <li className="p-4 text-center text-brand-text-light">Only you have access.</li>
                ) : (
                  permissions.map(perm => (
                    <li key={perm.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-brand-text">{perm.grantedToV2.user?.displayName}</p>
                        <p className="text-sm text-brand-text-light">{perm.grantedToV2.user?.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-brand-text-light capitalize">{perm.roles[0]}</span>
                        <button onClick={() => handleRevoke(perm.id)} disabled={removingId === perm.id} className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 flex justify-center items-center w-20">
                           {removingId === perm.id ? <Spinner className="w-4 h-4" /> : 'Remove'}
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManagePermissionsModal;