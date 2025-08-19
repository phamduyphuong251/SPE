import React, { useState, useCallback, FC } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMsal } from '@azure/msal-react';
import Modal from './Modal';
import { Spinner } from './icons';
import { uploadFile } from '../services/graphService';
import { UploadableFile } from '../types';

interface UploadFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveId: string;
  folderId: string;
  onUploadComplete: () => void;
}

const UploadFilesModal: FC<UploadFilesModalProps> = ({ isOpen, onClose, driveId, folderId, onUploadComplete }) => {
  const { instance, accounts } = useMsal();
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadableFile[] = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: true,
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {}
  });

  const handleUpload = async () => {
    setIsUploading(true);
    const uploadPromises = files.filter(f => f.status === 'pending').map(async (uploadableFile) => {
        setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, status: 'uploading' } : f));
        try {
            await uploadFile(instance, accounts[0], driveId, folderId, uploadableFile.file);
            setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, status: 'success' } : f));
        } catch (error) {
            console.error('Upload failed for', uploadableFile.file.name, error);
            setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, status: 'error', errorMessage: 'Upload failed' } : f));
        }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
    onUploadComplete();
  };
  
  const handleClose = () => {
    if (isUploading) return;
    setFiles([]);
    onClose();
  }

  const allDone = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Files">
      <div className="flex flex-col space-y-4">
        <div
          {...getRootProps()}
          className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${isDragActive ? 'border-brand-primary bg-brand-primary-light' : 'border-brand-border hover:border-brand-secondary'}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-brand-primary">Drop the files here ...</p>
          ) : (
            <p className="text-brand-text-light">Drag 'n' drop some files here, or click to select files</p>
          )}
        </div>
        
        {files.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-sm truncate pr-2">{f.file.name}</span>
                {f.status === 'pending' && <span className="text-xs text-gray-500">Pending</span>}
                {f.status === 'uploading' && <Spinner className="w-4 h-4 text-brand-secondary" />}
                {f.status === 'success' && <span className="text-green-500">&#10003;</span>}
                {f.status === 'error' && <span className="text-red-500 text-xs" title={f.errorMessage}>Error</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <button onClick={handleClose} disabled={isUploading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">
            {allDone ? 'Close' : 'Cancel'}
          </button>
          <button onClick={handleUpload} disabled={isUploading || files.every(f => f.status !== 'pending')} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-opacity-90 disabled:bg-opacity-50">
            {isUploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} File(s)`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadFilesModal;