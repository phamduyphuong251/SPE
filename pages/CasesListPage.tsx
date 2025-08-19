import React, { useState, useEffect, useCallback, FC } from 'react';
import { useMsal } from "@azure/msal-react";
import { Link } from 'react-router-dom';
import { fetchLegalCases, createLegalCase } from '../services/graphService';
import { LegalCase } from '../types';
import { Spinner } from '../components/icons';
import Modal from '../components/Modal';

const CasesListPage: FC = () => {
  const { instance, accounts } = useMsal();
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseDescription, setNewCaseDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCases = await fetchLegalCases(instance, accounts[0]);
      setCases(fetchedCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [instance, accounts]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleCreateCase = async () => {
    if (!newCaseName.trim()) {
        alert("Case name is required.");
        return;
    }
    setIsCreating(true);
    try {
        await createLegalCase(instance, accounts[0], newCaseName, newCaseDescription);
        setIsModalOpen(false);
        setNewCaseName('');
        setNewCaseDescription('');
        // Add a 2-second delay to allow for backend replication before refreshing the list.
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadCases(); // Refresh the list
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
        setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="w-12 h-12 text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-brand-text">Legal Cases</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90 transition"
        >
          Create New Case
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-brand-border">
          {cases.length === 0 ? (
            <li className="p-6 text-center text-brand-text-light">No legal cases found.</li>
          ) : (
            cases.map((legalCase) => (
              <li key={legalCase.id} className="hover:bg-brand-primary-light transition-colors">
                <Link to={`/cases/${legalCase.driveId}/items/root`} className="block p-6">
                  <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-brand-secondary">{legalCase.displayName}</p>
                        <p className="text-sm text-brand-text-light mt-1">{legalCase.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm text-brand-text-light">
                            Created: {new Date(legalCase.createdDateTime).toLocaleDateString()}
                          </p>
                      </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Legal Case">
        <div className="space-y-4">
            <div>
                <label htmlFor="caseName" className="block text-sm font-medium text-gray-700">Case Name</label>
                <input type="text" id="caseName" value={newCaseName} onChange={e => setNewCaseName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    placeholder="e.g., Project Phoenix" />
            </div>
             <div>
                <label htmlFor="caseDesc" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea id="caseDesc" value={newCaseDescription} onChange={e => setNewCaseDescription(e.target.value)} rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    placeholder="A brief description of the legal case."></textarea>
            </div>
            <div className="flex justify-end pt-2">
                <button onClick={handleCreateCase} disabled={isCreating} className="px-4 py-2 font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-opacity-50">
                    {isCreating ? <Spinner className="w-5 h-5"/> : 'Create Case'}
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default CasesListPage;