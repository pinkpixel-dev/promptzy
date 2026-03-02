import { supabase, getSupabaseCredentials } from "@/integrations/supabase/client";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Prompt, Tag } from "@/types";

// Regex to validate UUID strings
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Define a simple table interface for our expected Supabase schema
interface PromptsTable {
  id: string;
  content: string;
  tags: string[];
  createdat: string;
  title: string;
  category: string;
  description: string;
  user_id: string;
  ispublic: boolean;
  likes: number;
  views: number;
  comments: number;
}

// SQL for table creation - separated for reuse
export const CREATE_TABLE_SQL = `
-- Create the prompts table with exact column names expected by the code
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  category TEXT DEFAULT 'task',
  description TEXT DEFAULT '',
  user_id TEXT NOT NULL,
  ispublic BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_createdat ON prompts(createdat);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;
DROP POLICY IF EXISTS "Allow all access" ON prompts;
DROP POLICY IF EXISTS "Temporary allow all" ON prompts;

-- Create permissive policy for all operations (you can restrict this later)
CREATE POLICY "Allow all operations for now" ON prompts FOR ALL USING (true);
`;

// Full setup SQL for the database setup guide (complete script with migration support)
export const FULL_SETUP_SQL = `-- 🚀 Promptzy - Supabase Setup Script
-- Run this in your Supabase SQL Editor to set up the database

-- ============================================================================
-- 1. CREATE THE PROMPTS TABLE (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  category TEXT DEFAULT 'task',
  description TEXT DEFAULT '',
  user_id TEXT NOT NULL,
  ispublic BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0
);

-- ============================================================================
-- 2. ADD MISSING COLUMNS (if your table already exists)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prompts' AND column_name = 'user_id') THEN
        ALTER TABLE prompts ADD COLUMN user_id TEXT;
        UPDATE prompts SET user_id = 'legacy-user' WHERE user_id IS NULL;
        ALTER TABLE prompts ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_createdat ON prompts(createdat);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. DROP ANY EXISTING POLICIES (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;
DROP POLICY IF EXISTS "Allow all access" ON prompts;
DROP POLICY IF EXISTS "Temporary allow all" ON prompts;

-- ============================================================================
-- 6. CREATE PERMISSIVE RLS POLICIES
-- ============================================================================

CREATE POLICY "Allow all operations for now" ON prompts FOR ALL USING (true);
`;

// Cache for the current client to avoid creating multiple instances
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedClient: SupabaseClient<any> | null = null;
let cachedCredentials: { url: string; key: string } | null = null;

// Helper function to create a fresh client with current credentials
const createFreshClient = () => {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  // Check if we can reuse the cached client
  if (cachedClient && cachedCredentials &&
      cachedCredentials.url === supabaseUrl &&
      cachedCredentials.key === supabaseKey) {
    return cachedClient;
  }

  // Create new client and cache it
  cachedClient = createClient(supabaseUrl, supabaseKey);
  cachedCredentials = { url: supabaseUrl, key: supabaseKey };

  return cachedClient;
};

// Function to clear the cached client (call when credentials change)
export const clearClientCache = () => {
  cachedClient = null;
  cachedCredentials = null;
};

// Function to check if the prompts table exists
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkTableExists = async (client: SupabaseClient<any>): Promise<boolean> => {
  try {
    console.log("Checking if prompts table exists...");
    const { error } = await client.from('prompts').select('id').limit(1);

    // If no error or error is not about missing table, the table exists
    if (!error || error.code !== '42P01') {
      console.log("Table exists or accessible");
      return true;
    }

    console.log("Table does not exist (42P01 error)");
    return false;
  } catch (err) {
    console.error("Error checking if table exists:", err);
    return false;
  }
};

// Note: Automatic table creation is not supported by Supabase for security reasons.
// Users must create the table manually using the SQL Editor in their Supabase dashboard.

// Function to check if the prompts table exists
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensurePromptsTable = async (client: SupabaseClient<any>) => {
  try {
    // Check if table exists
    const tableExists = await checkTableExists(client);

    if (tableExists) {
      return true;
    }

    console.log("Prompts table doesn't exist. Manual creation required using Supabase SQL Editor.");
    return false;
  } catch (err) {
    console.error("Error checking prompts table:", err);
    return false;
  }
};

// Function to get a consistent user ID (either from auth or user-defined)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUserId = async (client: SupabaseClient<any>): Promise<string> => {
  try {
    // First try to get authenticated user ID
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData?.session?.user?.id) {
      console.log("Using authenticated user ID:", sessionData.session.user.id);
      return sessionData.session.user.id;
    }

    // If no authenticated user, check for a custom user ID set by the user
    const customUserId = localStorage.getItem('custom-user-id');
    if (customUserId && customUserId.trim()) {
      console.log("Using custom user ID:", customUserId);
      return customUserId.trim();
    }

    // If no custom user ID, use a device-specific anonymous ID
    let anonymousId = localStorage.getItem('supabase-anonymous-id');
    if (!anonymousId) {
      // Generate a new anonymous ID if none exists
      anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('supabase-anonymous-id', anonymousId);
      console.log("Generated new anonymous ID:", anonymousId);
    } else {
      console.log("Using existing anonymous ID:", anonymousId);
    }
    return anonymousId;
  } catch (err) {
    console.error("Error getting user ID:", err);
    // Fallback to simple anonymous ID with timestamp
    const fallbackId = `anon-${Date.now()}`;
    console.log("Using fallback ID:", fallbackId);
    return fallbackId;
  }
};

// Helper function to set a custom user ID for cross-browser sync
export const setCustomUserId = (userId: string): boolean => {
  try {
    if (!userId || !userId.trim()) {
      localStorage.removeItem('custom-user-id');
      console.log("Custom user ID cleared");
      return true;
    }

    const cleanUserId = userId.trim();
    localStorage.setItem('custom-user-id', cleanUserId);
    console.log("Custom user ID set:", cleanUserId);
    return true;
  } catch (error) {
    console.error("Error setting custom user ID:", error);
    return false;
  }
};

// Helper function to get the current user ID (for display purposes)
export const getCurrentUserId = async (): Promise<string> => {
  const client = createFreshClient();
  return await getUserId(client);
};

export const getPromptsFromSupabase = async (): Promise<Prompt[]> => {
  // Create a fresh client to ensure we have the latest credentials
  const client = createClient(getSupabaseCredentials().supabaseUrl, getSupabaseCredentials().supabaseKey);

  try {
    console.log("Fetching prompts from Supabase with fresh client...");
    const tableReady = await ensurePromptsTable(client);
    if (!tableReady) {
      console.error("Prompts table is not available");
      return [];
    }

    // Get consistent user ID
    const userId = await getUserId(client);
    console.log("Current user ID:", userId);

    // Filter prompts by the current user ID to ensure we only get this user's prompts
    const { data, error } = await client
      .from('prompts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching prompts from Supabase:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      console.log("No prompts found in Supabase for this user");
      return [];
    }

    console.log(`Found ${data.length} prompts in Supabase for user ${userId}`);

    // Transform data to match our Prompt type
    return data.map((item: PromptsTable) => ({
      id: item.id || '',
      text: item.content || '', // Map content to text
      tags: Array.isArray(item.tags) ? item.tags.map((tagName: string) => ({
        id: tagName, // Using the tag name as the ID
        name: tagName
      })) : [],
      createdAt: item.createdat || new Date().toISOString(),
      type: (item.category as "system" | "task" | "image" | "video") || 'task' // Map category to type
    }));
  } catch (err) {
    console.error("Exception while fetching prompts:", err);
    return [];
  }
};

export const savePromptToSupabase = async (prompt: Prompt): Promise<boolean> => {
  const client = createFreshClient();

  try {
    // Validate or regenerate prompt ID for proper UUID format
    let idToSave = prompt.id;
    if (!UUID_REGEX.test(idToSave)) {
      const newId = crypto.randomUUID();
      console.log(`Invalid UUID "${prompt.id}" detected, regenerating to "${newId}"`);
      idToSave = newId;
    }
    console.log("Saving prompt to Supabase:", idToSave);
    const tableReady = await ensurePromptsTable(client);
    if (!tableReady) {
      console.error("Prompts table is not available");
      return false;
    }

    // Get consistent user ID
    const userId = await getUserId(client);
    console.log("Current user ID for saving:", userId);

    // Create the prompt object to save
    const promptToSave = {
      id: idToSave,
      content: prompt.text, // Map text to content
      tags: prompt.tags.map(tag => tag.name), // Convert Tag objects to string names
      createdat: prompt.createdAt,
      title: prompt.text.substring(0, 50), // Use first 50 chars of text as title
      category: prompt.type || 'task',
      description: '',
      user_id: userId,
      ispublic: false,
      likes: 0,
      views: 0,
      comments: 0
    };

    console.log("Saving prompt data:", promptToSave);

    const { error } = await client
      .from('prompts')
      .upsert(promptToSave, { onConflict: 'id' });

    if (error) {
      console.error("Error saving prompt to Supabase:", error);
      return false;
    }

    console.log("Successfully saved prompt to Supabase:", prompt.id);
    return true;
  } catch (err) {
    console.error("Exception while saving prompt:", err);
    return false;
  }
};

export const deletePromptFromSupabase = async (id: string): Promise<boolean> => {
  const client = createFreshClient();

  try {
    const tableReady = await ensurePromptsTable(client);
    if (!tableReady) {
      console.error("Prompts table is not available");
      return false;
    }

    const { error } = await client
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting prompt from Supabase:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception while deleting prompt:", err);
    return false;
  }
};

export const syncPromptsToSupabase = async (localPrompts: Prompt[]): Promise<void> => {
  console.log(`Syncing ${localPrompts.length} local prompts to Supabase...`);
  let successCount = 0;
  let failCount = 0;

  for (const prompt of localPrompts) {
    const success = await savePromptToSupabase(prompt);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`Sync complete: ${successCount} prompts synced successfully, ${failCount} failed`);
};

// Helper function to get diagnostic information about the Supabase connection
export const getSupabaseDiagnostics = async (): Promise<{
  url: string;
  keyLength: number;
  networkConnectivity: boolean;
  corsIssue: boolean;
  authConnection: boolean;
  dataConnection: boolean;
  tableExists: boolean;
  error?: string;
}> => {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
  const diagnostics = {
    url: supabaseUrl.substring(0, 15) + '...',
    keyLength: supabaseKey.length,
    networkConnectivity: false,
    corsIssue: false,
    authConnection: false,
    dataConnection: false,
    tableExists: false,
    error: undefined
  };

  try {
    // Test basic network connectivity
    const networkTest = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    }).then(() => true).catch(() => false);

    diagnostics.networkConnectivity = networkTest;

    if (!networkTest) {
      diagnostics.error = "Network connectivity issue detected. Please check your internet connection.";
      return diagnostics;
    }

    // Create a fresh client with the current credentials
    const client = createClient(supabaseUrl, supabaseKey);

    // Test auth connection
    try {
      const { data: authData, error: authError } = await client.auth.getSession();
      diagnostics.authConnection = !authError;
    } catch (err) {
      diagnostics.authConnection = false;
      if (err instanceof Error && (err.message.includes('CORS') || err.message.includes('cross-origin'))) {
        diagnostics.corsIssue = true;
        diagnostics.error = "CORS issue detected. Your browser is blocking cross-origin requests to Supabase.";
      }
    }

    // Test data connection
    try {
      const { error: healthError } = await client
        .from('prompts')
        .select('id')
        .limit(1)
        .maybeSingle();

      diagnostics.dataConnection = !healthError ||
        healthError.code === '42P01' ||
        (healthError.message && healthError.message.includes('permission denied'));

      // Check if the prompts table exists
      diagnostics.tableExists = await checkTableExists(client);
    } catch (err) {
      diagnostics.dataConnection = false;
      if (!diagnostics.error && err instanceof Error) {
        diagnostics.error = err.message;
      }
    }

    return diagnostics;
  } catch (err) {
    if (err instanceof Error) {
      diagnostics.error = err.message;
    } else {
      diagnostics.error = "Unknown error occurred during diagnostics";
    }
    return diagnostics;
  }
};

// Helper function to check connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  // Create a fresh client for connection testing to ensure we're using the latest credentials
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
  console.log("Testing Supabase connection with URL:", supabaseUrl.substring(0, 15) + "...");

  // Validate URL format before attempting connection
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error("Invalid Supabase URL format. URL must be in the format https://your-project.supabase.co");
    return false;
  }

  // Validate key format (basic check)
  if (!supabaseKey || supabaseKey.length < 20) {
    console.error("Invalid Supabase key format. Key appears to be too short or empty.");
    return false;
  }

  // Create a fresh client with the current credentials
  const client = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Testing Supabase connection...");

    // First test auth connection - this is critical
    const { data: authData, error: authError } = await client.auth.getSession();
    if (authError) {
      console.warn("Supabase auth check warning (continuing anyway):", authError);
      // Don't fail just on auth error - anonymous usage is still valid
    } else {
      console.log("Auth connection successful, user:", authData?.session?.user?.id || "anonymous");
    }

    // Then test data connection with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout after 5 seconds")), 5000)
    );

    const connectionPromise = client
      .from('prompts')
      .select('id')
      .limit(1)
      .maybeSingle();

    // Race the connection against the timeout
    const { data: healthData, error: healthError } = await Promise.race([
      connectionPromise,
      timeoutPromise.then(() => { throw new Error("Connection timeout"); })
    ]);

    // If we get a permission error or table not found error, that's actually okay
    // It means we connected to the API but the table may not exist or we don't have permission
    if (healthError) {
      if (healthError.code === '42P01' ||
          (healthError.message && healthError.message.includes('permission denied'))) {
        console.log("Connected to API but table doesn't exist or no permission");
        // This is actually a successful connection - we just need to create the table
        return true;
      }
      console.error("Supabase data check failed:", healthError);
      return false;
    }

    // Check if the prompts table exists
    const tableExists = await checkTableExists(client);
    console.log("Supabase connection successful, table exists:", tableExists);

    return true;
  } catch (err) {
    console.error("Supabase connection test exception:", err);
    // Log more detailed error information
    if (err instanceof Error) {
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);

      // Network errors often have specific names
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.error("This appears to be a network error. Check your internet connection and Supabase URL.");
      }

      // CORS errors have specific patterns
      if (err.message.includes('CORS') || err.message.includes('cross-origin')) {
        console.error("This appears to be a CORS error. Ensure your Supabase project allows requests from this origin.");
      }
    }
    return false;
  }
};
