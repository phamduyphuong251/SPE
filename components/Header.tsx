import React, { FC, useState } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../constants';
import UserProfile from './UserProfile';

interface HeaderProps {
  supabaseSession: Session | null;
}

const Header: FC<HeaderProps> = ({ supabaseSession }) => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleLogout = async () => {
    if (isAuthenticated) {
      localStorage.clear();
      instance.logoutPopup({
        postLogoutRedirectUri: "/",
      });
    } else if (supabaseSession) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
        }
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  const msalUser = accounts[0];
  const supabaseUser = supabaseSession?.user;

  const isLoggedIn = isAuthenticated || !!supabaseUser;
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-primary">Contoso Legal</h1>
        {isLoggedIn && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-brand-text-light">
                <span className="font-semibold">{msalUser?.name || supabaseUser?.email}</span>
            </div>
            {supabaseUser && (
              <button
                onClick={() => setShowUserProfile(true)}
                className="px-3 py-2 text-sm font-medium text-brand-secondary bg-brand-secondary-light rounded-md hover:bg-opacity-80 transition"
              >
                Profile
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary-light rounded-md hover:bg-opacity-80 transition"
            >
              Logout
            </button>
          </div>
        )}
        
        <UserProfile 
          isOpen={showUserProfile} 
          onClose={() => setShowUserProfile(false)} 
        />
      </div>
    </header>
  );
};

export default Header;