
import { IPublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { graphScopes, CONTAINER_TYPE_ID } from "../constants";
import { LegalCase, DriveItem, Permission } from "../types";

const GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0";

async function getAccessToken(instance: IPublicClientApplication, account: AccountInfo): Promise<string> {
  const response = await instance.acquireTokenSilent({
    ...graphScopes.api,
    account: account,
  });
  return response.accessToken;
}

export async function fetchLegalCases(instance: IPublicClientApplication, account: AccountInfo): Promise<LegalCase[]> {
  const accessToken = await getAccessToken(instance, account);
  const response = await fetch(
    `${GRAPH_API_BASE_URL}/storage/fileStorage/containers?$select=id,displayName,description,createdDateTime&$filter=containerTypeId eq ${CONTAINER_TYPE_ID}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch legal cases: ${response.statusText}`);
  }

  const data = await response.json();
  // We need to get the driveId for each container to browse files
  const casesWithDrives: LegalCase[] = [];
  
  for (const c of data.value) {
    try {
      const driveResponse = await fetch(`${GRAPH_API_BASE_URL}/storage/fileStorage/containers/${c.id}/drive`, {
          headers: { Authorization: `Bearer ${accessToken}` }
      });
      if(driveResponse.ok) {
          const driveData = await driveResponse.json();
          casesWithDrives.push({ ...c, driveId: driveData.id });
      } else {
          console.warn(`Could not retrieve drive for case: ${c.displayName}`);
      }
    } catch (error) {
      console.error(`Error fetching drive for case ${c.id}:`, error);
    }
  }

  return casesWithDrives;
}

export async function createLegalCase(instance: IPublicClientApplication, account: AccountInfo, name: string, description: string): Promise<LegalCase> {
    const accessToken = await getAccessToken(instance, account);
    
    // Tạo container trong SharePoint site
    const response = await fetch(`${GRAPH_API_BASE_URL}/sites/root/lists`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            displayName: name,
            description: description,
            list: {
                template: 'documentLibrary'
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Create case error:', errorText);
        throw new Error(`Failed to create legal case: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Tạo một mock response để tương thích với interface hiện tại
    return {
        id: result.id,
        displayName: name,
        description: description,
        createdDateTime: new Date().toISOString(),
        driveId: result.id // Sử dụng list ID làm drive ID
    };
}


export async function fetchDriveItems(instance: IPublicClientApplication, account: AccountInfo, driveId: string, itemId: string = 'root'): Promise<DriveItem[]> {
  const accessToken = await getAccessToken(instance, account);
  const response = await fetch(
    `${GRAPH_API_BASE_URL}/drives/${driveId}/items/${itemId}/children?$expand=listItem($expand=fields)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch drive items: ${response.statusText}`);
  }
  const data = await response.json();
  return data.value;
}

export async function fetchItemDetails(instance: IPublicClientApplication, account: AccountInfo, driveId: string, itemId: string): Promise<DriveItem> {
    const accessToken = await getAccessToken(instance, account);
    const response = await fetch(`${GRAPH_API_BASE_URL}/drives/${driveId}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`Failed to fetch item details: ${response.statusText}`);
    return response.json();
}

export async function createFolder(instance: IPublicClientApplication, account: AccountInfo, driveId: string, parentItemId: string, folderName: string): Promise<DriveItem> {
    const accessToken = await getAccessToken(instance, account);
    const response = await fetch(`${GRAPH_API_BASE_URL}/drives/${driveId}/items/${parentItemId}/children`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
        })
    });
     if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`);
    }
    return response.json();
}

export async function uploadFile(instance: IPublicClientApplication, account: AccountInfo, driveId: string, parentItemId: string, file: File): Promise<DriveItem> {
    const accessToken = await getAccessToken(instance, account);
    const url = `${GRAPH_API_BASE_URL}/drives/${driveId}/items/${parentItemId}:/${file.name}:/content`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': file.type
        },
        body: file
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
    }
    return response.json();
}

export async function getPreviewUrl(instance: IPublicClientApplication, account: AccountInfo, driveId: string, itemId: string): Promise<string> {
    const accessToken = await getAccessToken(instance, account);
    const response = await fetch(`${GRAPH_API_BASE_URL}/drives/${driveId}/items/${itemId}/preview`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get preview URL: ${response.statusText}`);
    }
    const data = await response.json();
    return data.getUrl + "&nb=true";
}

export async function getPermissions(instance: IPublicClientApplication, account: AccountInfo, driveId: string, itemId: string): Promise<Permission[]> {
    const accessToken = await getAccessToken(instance, account);
    const response = await fetch(`${GRAPH_API_BASE_URL}/drives/${driveId}/items/${itemId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`Failed to get permissions: ${response.statusText}`);
    const data = await response.json();
    return data.value;
}

export async function inviteUser(instance: IPublicClientApplication, account: AccountInfo, driveId: string, itemId: string, email: string, role: 'read' | 'write'): Promise<Permission[]> {
    const accessToken = await getAccessToken(instance, account);
    const response = await fetch(`${GRAPH_API_BASE_URL}/drives/${driveId}/items/${itemId}/invite`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            recipients: [{ email: email }],
            message: "You've been invited to collaborate on a file.",
            requireSignIn: true,
            sendInvitation: true,
            roles: [role]
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to invite user: ${errorData.error.message}`);
    }
    const data = await response.json();
    return data.value;
}

export async function revokePermission(instance: IPublicClientApplication, account: AccountInfo, driveId: string, itemId: string, permissionId: string): Promise<void> {
    const accessToken = await getAccessToken(instance, account);
    const response = await fetch(`${GRAPH_API_BASE_URL}/drives/${driveId}/items/${itemId}/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`Failed to revoke permission: ${response.statusText}`);
}