
export interface Identity {
    displayName: string;
    id: string;
}

export interface IdentitySet {
    user?: Identity;
    application?: Identity;
    device?: Identity;
}

export interface LegalCase {
  id: string;
  displayName: string;
  description: string;
  createdDateTime: string;
  driveId?: string; // We'll need this to fetch files
}

export interface DriveItem {
  id: string;
  name: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  size: number;
  webUrl: string;
  parentReference: {
    driveId: string;
    id: string;
  };
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
  '@microsoft.graph.downloadUrl'?: string;
  createdBy?: IdentitySet;
  lastModifiedBy?: IdentitySet;
}

export interface Breadcrumb {
  name: string;
  id: string;
}

export interface UploadableFile {
  id: number;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export interface SharePointIdentitySet {
  user?: {
    displayName: string;
    email: string;
    id: string;
  };
}

export interface Permission {
  id: string;
  roles: ('read' | 'write')[];
  grantedToV2: SharePointIdentitySet;
}
