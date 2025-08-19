import React, { useState, useEffect, useCallback, useRef, FC } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { fetchDriveItems, fetchItemDetails, createFolder, getPreviewUrl } from '../services/graphService';
import { DriveItem, Breadcrumb } from '../types';
import { Spinner, FolderIcon, getFileIcon, ChevronRightIcon, HomeIcon, MoreVerticalIcon } from '../components/icons';
import UploadFilesModal from '../components/UploadFilesModal';
import Modal from '../components/Modal';
import ManagePermissionsModal from '../components/ManagePermissionsModal';

const CaseFilesPage: FC = () => {
    const { driveId, itemId = 'root' } = useParams<{ driveId: string; itemId?: string }>();
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    
    const [items, setItems] = useState<DriveItem[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [isCreateFolderModalOpen, setCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewItemName, setPreviewItemName] = useState('');

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const [selectedItemForPermissions, setSelectedItemForPermissions] = useState<DriveItem | null>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = useCallback(async () => {
        if (!driveId) return;
        setLoading(true);
        setError(null);
        try {
            const currentFolderItems = await fetchDriveItems(instance, accounts[0], driveId, itemId);
            setItems(currentFolderItems.sort((a, b) => (a.folder ? -1 : 1) - (b.folder ? -1 : 1) || a.name.localeCompare(b.name)));

            const driveDetails = await fetchItemDetails(instance, accounts[0], driveId, 'root');

            const newBreadcrumbs: Breadcrumb[] = [{ name: driveDetails.name, id: 'root' }];
            if (itemId !== 'root') {
                let currentItem = await fetchItemDetails(instance, accounts[0], driveId, itemId);
                const pathItems: Breadcrumb[] = [{ name: currentItem.name, id: currentItem.id }];
                while(currentItem.parentReference && currentItem.parentReference.id !== driveDetails.id) {
                     currentItem = await fetchItemDetails(instance, accounts[0], driveId, currentItem.parentReference.id);
                     pathItems.unshift({name: currentItem.name, id: currentItem.id});
                }
                newBreadcrumbs.push(...pathItems);
            }
            setBreadcrumbs(newBreadcrumbs);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [driveId, itemId, instance, accounts]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !driveId) return;
        setIsCreatingFolder(true);
        try {
            await createFolder(instance, accounts[0], driveId, itemId, newFolderName);
            setCreateFolderModalOpen(false);
            setNewFolderName('');
            await loadData();
        } catch (err) {
            alert('Failed to create folder: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const handleItemClick = async (item: DriveItem) => {
        if (item.folder) {
            navigate(`/cases/${driveId}/items/${item.id}`);
        } else if (item.webUrl && (item.file?.mimeType?.includes('officedocument') || item.file?.mimeType?.includes('presentation') || item.file?.mimeType?.includes('spreadsheet'))) {
            window.open(item.webUrl, '_blank');
        } else {
             try {
                const url = await getPreviewUrl(instance, accounts[0], driveId, item.id);
                setPreviewUrl(url);
                setPreviewItemName(item.name);
             } catch(err) {
                alert("Could not generate a preview for this file type.");
             }
        }
    };
    
    const handleManageAccess = (item: DriveItem) => {
        setSelectedItemForPermissions(item);
        setActiveMenu(null);
    }

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner className="w-12 h-12 text-brand-primary" /></div>;
    if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-4">
                <nav className="flex items-center text-sm text-brand-text-light" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-brand-primary"><HomeIcon className="w-5 h-5"/></Link>
                    <ChevronRightIcon className="w-4 h-4 mx-1" />
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                            {index === breadcrumbs.length - 1 ? (
                                <span className="font-semibold text-brand-text">{crumb.name}</span>
                            ) : (
                                <Link to={`/cases/${driveId}/items/${crumb.id}`} className="hover:underline">{crumb.name}</Link>
                            )}
                            {index < breadcrumbs.length - 1 && <ChevronRightIcon className="w-4 h-4 mx-1" />}
                        </React.Fragment>
                    ))}
                </nav>
                 <div className="flex space-x-2">
                    <button onClick={() => setCreateFolderModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-md hover:bg-opacity-90">Create Folder</button>
                    <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90">Upload Files</button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 flex items-center border-b border-brand-border bg-gray-50 text-xs font-semibold text-brand-text-light uppercase tracking-wider">
                    <div className="flex-1">Name</div>
                    <div className="w-40 text-left">Uploaded By</div>
                    <div className="w-32 text-left">Modified</div>
                    <div className="w-24 text-left">Size</div>
                    <div className="w-16 text-center">Actions</div>
                </div>
                <ul className="divide-y divide-brand-border">
                    {items.length === 0 ? (
                        <li className="p-6 text-center text-brand-text-light">This folder is empty.</li>
                    ) : (
                        items.map(item => (
                            <li key={item.id} className="p-4 flex items-center hover:bg-brand-primary-light transition-colors group">
                                <div className="flex-1 flex items-center space-x-3 truncate cursor-pointer" onClick={() => handleItemClick(item)}>
                                    {item.folder ? <FolderIcon className="w-6 h-6 text-yellow-500 flex-shrink-0"/> : getFileIcon(item.name)}
                                    <span className="text-brand-text font-medium truncate" title={item.name}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="w-40 text-sm text-brand-text-light truncate" title={item.createdBy?.user?.displayName}>
                                    {item.createdBy?.user?.displayName || 'N/A'}
                                </div>
                                <div className="w-32 text-sm text-brand-text-light">
                                    {new Date(item.lastModifiedDateTime).toLocaleDateString()}
                                </div>
                                <div className="w-24 text-sm text-brand-text-light">
                                    {item.file ? `${(item.size / 1024).toFixed(1)} KB` : '--'}
                                </div>
                                <div className="w-16 text-center relative" ref={menuRef}>
                                    <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-2 rounded-full hover:bg-gray-200">
                                        <MoreVerticalIcon />
                                    </button>
                                    {activeMenu === item.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-brand-border">
                                            <ul className="py-1">
                                                <li>
                                                    <button onClick={() => { handleItemClick(item); setActiveMenu(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                        {item.folder ? 'Open' : 'Preview'}
                                                    </button>
                                                </li>
                                                {item.folder && (
                                                     <li>
                                                        <button onClick={() => handleManageAccess(item)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                            Manage Access
                                                        </button>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            
            <UploadFilesModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} driveId={driveId!} folderId={itemId!} onUploadComplete={loadData}/>

            <Modal isOpen={isCreateFolderModalOpen} onClose={() => setCreateFolderModalOpen(false)} title="Create New Folder">
                <div className="space-y-4">
                    <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name"
                           className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                    <div className="flex justify-end">
                        <button onClick={handleCreateFolder} disabled={isCreatingFolder} className="px-4 py-2 font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-opacity-50">
                            {isCreatingFolder ? <Spinner className="w-5 h-5"/> : "Create"}
                        </button>
                    </div>
                </div>
            </Modal>

            {previewUrl && (
                <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title={`Preview: ${previewItemName}`}>
                    <div className="w-full h-[70vh] flex flex-col">
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-secondary hover:underline mb-2">Open in new tab</a>
                        <iframe src={previewUrl} className="w-full h-full border-none" title={previewItemName}></iframe>
                    </div>
                </Modal>
            )}

            {selectedItemForPermissions && (
                <ManagePermissionsModal 
                    isOpen={!!selectedItemForPermissions} 
                    onClose={() => setSelectedItemForPermissions(null)}
                    driveId={driveId!}
                    item={selectedItemForPermissions}
                />
            )}
        </div>
    );
};

export default CaseFilesPage;