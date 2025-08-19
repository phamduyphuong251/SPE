import React, { useState, useEffect, FC } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import type { Session } from '@supabase/supabase-js';
import { supabase } from './constants';

import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import CasesListPage from './pages/CasesListPage';
import CaseFilesPage from './pages/CaseFilesPage';
import { Spinner } from './components/icons';

interface AppProps {
  pca: IPublicClientApplication;
}

const GuestDashboardPage = () => (
    <div className="container mx-auto px-6 py-8 text-center">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-brand-text">Welcome, External Collaborator!</h2>
            <p className="mt-4 text-brand-text-light">
                You have successfully logged in. Your dedicated dashboard and features are currently under construction.
            </p>
            <p className="mt-2 text-brand-text-light">
                Thank you for your patience.
            </p>
        </div>
    </div>
);


const App: FC<AppProps> = ({ pca }) => {
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <MsalProvider instance={pca}>
      <div className="flex flex-col min-h-screen">
        <Header supabaseSession={supabaseSession} />
        <main className="flex-grow">
          <AppContent supabaseSession={supabaseSession} loadingSupabaseSession={loadingSession} />
        </main>
        <Footer />
      </div>
    </MsalProvider>
  );
};

interface AppContentProps {
    supabaseSession: Session | null;
    loadingSupabaseSession: boolean;
}

const AppContent: FC<AppContentProps> = ({ supabaseSession, loadingSupabaseSession }) => {
  const { inProgress } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();
  
  const loading = inProgress === "startup" || inProgress === "handleRedirect" || loadingSupabaseSession;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full flex-grow">
        <Spinner className="w-16 h-16 text-brand-primary" />
      </div>
    );
  }

  return (
    <HashRouter>
        {isMsalAuthenticated ? (
            <Routes>
                <Route path="/" element={<CasesListPage />} />
                <Route path="/cases/:driveId/items/:itemId" element={<CaseFilesPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        ) : supabaseSession ? (
             <Routes>
                <Route path="/" element={<GuestDashboardPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        ) : (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        )}
    </HashRouter>
  );
};

export default App;