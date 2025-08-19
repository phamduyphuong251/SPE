import React, { useState, FC } from 'react';
import { useMsal } from "@azure/msal-react";
import { graphScopes, supabase } from '../constants';
import { Spinner } from '../components/icons';

const LoginPage: FC = () => {
  const { instance } = useMsal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);


  const handleMicrosoftLogin = () => {
    instance.loginPopup(graphScopes.loginRequest).catch(e => {
      console.error(e);
    });
  };

  const handleSupabaseAuth = async (action: 'sign_in' | 'sign_up') => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      if (action === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for a confirmation link!');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-background p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg text-center overflow-hidden flex flex-col md:flex-row">
        
        {/* Microsoft Login Section */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold text-brand-primary">Internal Users</h2>
          <p className="mt-2 text-brand-text-light">Login with your corporate account.</p>
          <button
            onClick={handleMicrosoftLogin}
            className="mt-6 w-full max-w-xs px-4 py-3 font-semibold text-white bg-brand-primary rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-transform transform hover:scale-105"
          >
            Login with Microsoft
          </button>
        </div>
        
        {/* Divider */}
        <div className="w-full md:w-px bg-brand-border"></div>

        {/* Supabase Login Section */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-gray-50">
           <h2 className="text-2xl font-bold text-brand-secondary">External Collaborators</h2>
           <p className="mt-2 text-brand-text-light">Sign in or create an account.</p>
           
           <form className="mt-6 w-full max-w-xs mx-auto space-y-4" onSubmit={e => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <div className="flex flex-col sm:flex-row gap-2">
                 <button
                    onClick={() => handleSupabaseAuth('sign_in')}
                    disabled={loading}
                    className="w-full px-4 py-2 font-semibold text-white bg-brand-secondary rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex justify-center"
                 >
                    {loading ? <Spinner className="w-5 h-5"/> : 'Sign In'}
                </button>
                 <button
                    onClick={() => handleSupabaseAuth('sign_up')}
                    disabled={loading}
                    className="w-full px-4 py-2 font-semibold text-brand-secondary bg-transparent border-2 border-brand-secondary rounded-lg hover:bg-brand-secondary hover:text-white transition"
                 >
                    Sign Up
                </button>
              </div>
           </form>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;