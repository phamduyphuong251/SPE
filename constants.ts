
import { createClient } from '@supabase/supabase-js';

// REQUIRED CONFIGURATION for SharePoint Embedded
export const CLIENT_ID = "09485547-a694-4ff7-a80b-f53407a016fa";
export const TENANT_ID = "c513262f-406c-4ce9-8b69-b26baf5df3c4";
export const CONTAINER_TYPE_ID = "90d9fe11-d20a-4277-9998-18b900cec6ef";

// MSAL Configuration
export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

// Scopes required for Microsoft Graph API
export const graphScopes = {
  loginRequest: {
    scopes: ["openid", "profile", "User.Read"]
  },
  api: {
    scopes: ["https://graph.microsoft.com/.default"]
  }
};

// Supabase Configuration
const supabaseUrl = 'https://zkoddacucfwoopiunely.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprb2RkYWN1Y2Z3b29waXVuZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODkxNDMsImV4cCI6MjA3MTE2NTE0M30.sA6YURwIxbFTFK5cwS2YFxPZXbzhDwonNcGeTIfbKxU';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);