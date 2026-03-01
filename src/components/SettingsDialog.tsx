import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, CheckCircle, AlertCircle, Sparkles, RefreshCw, Database as DatabaseIcon, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { testSupabaseConnection, checkTableExists, CREATE_TABLE_SQL, getSupabaseDiagnostics, setCustomUserId, getCurrentUserId, clearClientCache } from "@/lib/supabasePromptStore";
import { saveSystemPrompt, setUseDefaultPrompt, isUsingDefaultPrompt } from "@/lib/systemPromptStore";
import ShinyButton from "@/components/ShinyButton";
import { SYSTEM_PROMPT_DEFAULT } from "@/components/AIAssistant";
import {
  createSupabaseClient,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  SUPABASE_URL_KEY,
  SUPABASE_KEY_KEY
} from "@/integrations/supabase/client";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose
}) => {
  // Only load custom Supabase credentials if they exist, otherwise start with blank form
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return localStorage.getItem('custom-supabase-url') || '';
  });
  const [supabaseKey, setSupabaseKey] = useState<string>(() => {
    return localStorage.getItem('custom-supabase-key') || '';
  });
  const [customUserId, setCustomUserIdState] = useState<string>(() => {
    return localStorage.getItem('custom-user-id') || '';
  });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isConnectionTesting, setIsConnectionTesting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "failed">("untested");
  const [tableStatus, setTableStatus] = useState<"exists" | "missing" | "unknown">("unknown");
  const [showSqlSetup, setShowSqlSetup] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [diagnosticsData, setDiagnosticsData] = useState<Record<string, unknown> | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('ai-system-prompt') || SYSTEM_PROMPT_DEFAULT;
  });
  const [useDefaultSystemPrompt, setUseDefaultSystemPrompt] = useState<boolean>(() => {
    return isUsingDefaultPrompt();
  });
  const { toast } = useToast();

  // Load current user ID when dialog opens
  useEffect(() => {
    if (isOpen) {
      getCurrentUserId().then(setCurrentUserId);

      // Update the custom system prompt if it's still the old version
      const storedPrompt = localStorage.getItem('ai-system-prompt');
      if (storedPrompt && storedPrompt !== SYSTEM_PROMPT_DEFAULT) {
        // Check if it's the old prompt by looking for specific old text
        if (storedPrompt.includes('You are a helpful AI prompt generator') &&
            storedPrompt.includes('Always provide clear, actionable prompts')) {
          // This is the old prompt, update it to the new one
          setCustomSystemPrompt(SYSTEM_PROMPT_DEFAULT);
          // Don't save it yet - let the user see the update and save manually
          toast({
            title: "AI Prompt Updated",
            description: "Your AI system prompt has been updated to the latest version. Click 'Save Changes' to apply.",
          });
        }
      }
    }
  }, [isOpen]);

  const handleCustomUserIdChange = (newUserId: string) => {
    setCustomUserIdState(newUserId);
    setCustomUserId(newUserId);
    // Update current user ID display
    getCurrentUserId().then(setCurrentUserId);
  };

  const extractProjectId = (url: string): string => {
    // Extract the project ID from the Supabase URL
    // Example: https://abcdefghijklmn.supabase.co -> abcdefghijklmn
    const match = url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/);
    return match ? match[1] : "";
  };

  const getSupabaseSqlEditorUrl = (): string => {
    const projectId = extractProjectId(supabaseUrl);
    if (!projectId) return "https://app.supabase.com/";
    return `https://app.supabase.com/project/${projectId}/sql/new`;
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Missing Information",
        description: "Please enter both Supabase URL and API Key",
        variant: "destructive"
      });
      return;
    }

    // Basic validation before even trying to connect
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      toast({
        title: "Invalid URL Format",
        description: "Supabase URL should be in the format: https://your-project.supabase.co",
        variant: "destructive"
      });
      return;
    }

    if (supabaseKey.length < 20) {
      toast({
        title: "Invalid Key Format",
        description: "The Supabase key appears to be too short. Please check your anon key.",
        variant: "destructive"
      });
      return;
    }

    setIsConnectionTesting(true);
    setConnectionStatus("untested");
    setTableStatus("unknown");
    setShowSqlSetup(false);

    // Save the credentials using our helper function
    const savedSuccessfully = saveSupabaseCredentials(supabaseUrl, supabaseKey);

    // Clear the client cache so new credentials are used
    clearClientCache();

    if (!savedSuccessfully) {
      toast({
        title: "Storage Error",
        description: "Could not save credentials to browser storage. Please check your browser settings.",
        variant: "destructive"
      });
      setIsConnectionTesting(false);
      return;
    }

    // Test basic connection with a timeout
    try {
      // Set a timeout for the connection test
      const connectionPromise = testSupabaseConnection();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout after 10 seconds")), 10000)
      );

      // Race the connection test against the timeout
      const isConnected = await Promise.race([
        connectionPromise,
        timeoutPromise.then(() => {
          toast({
            title: "Connection Timeout",
            description: "The connection to Supabase timed out. Please check your URL and internet connection.",
            variant: "destructive"
          });
          return false;
        })
      ]);

      if (!isConnected) {
        setIsConnectionTesting(false);
        setConnectionStatus("failed");
        toast({
          title: "Connection Failed",
          description: "Could not connect to Supabase. Please check your credentials and try again.",
          variant: "destructive"
        });
        return;
      }

      // Check if table exists
      const client = createSupabaseClient();
      const tableExists = await checkTableExists(client);

      if (tableExists) {
        setTableStatus("exists");
        setConnectionStatus("success");
        setIsConnectionTesting(false);
        toast({
          title: "Connection Successful",
          description: "Successfully connected to your Supabase instance with table access.",
        });
        return;
      }

      // Table doesn't exist, show SQL setup guidance
      setTableStatus("missing");
      setConnectionStatus("failed");
      setShowSqlSetup(true);
      toast({
        title: "Table Setup Required",
        description: "Connected to Supabase, but the prompts table doesn't exist. Please create it manually.",
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error during connection test:", error);
      setConnectionStatus("failed");
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsConnectionTesting(false);
    }
  };

  const handleDiagnoseConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Missing Information",
        description: "Please enter both Supabase URL and API Key",
        variant: "destructive"
      });
      return;
    }

    setIsDiagnosing(true);
    setShowDiagnostics(true);

    try {
      // Save the credentials temporarily for testing
      saveSupabaseCredentials(supabaseUrl, supabaseKey);
      clearClientCache();

      // Run diagnostics
      const diagnostics = await getSupabaseDiagnostics();
      setDiagnosticsData(diagnostics);

      console.log("Supabase connection diagnostics:", diagnostics);

      toast({
        title: "Diagnostics Complete",
        description: "Connection diagnostics have been collected.",
      });
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast({
        title: "Diagnostics Failed",
        description: "Could not complete diagnostics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(CREATE_TABLE_SQL.trim());
    toast({
      title: "SQL Copied",
      description: "Table creation SQL copied to clipboard."
    });
  };



  const openSupabaseSqlEditor = () => {
    window.open(getSupabaseSqlEditorUrl(), '_blank');
  };

  const handleResetSystemPrompt = () => {
    setCustomSystemPrompt(SYSTEM_PROMPT_DEFAULT);
    toast({
      title: "System Prompt Reset",
      description: "The system prompt has been reset to default."
    });
  };



  const handleSave = async () => {
    // Check if custom Supabase config is provided
    if (supabaseUrl && supabaseKey) {
      // Basic validation before saving
      if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
        toast({
          title: "Invalid URL Format",
          description: "Supabase URL should be in the format: https://your-project.supabase.co",
          variant: "destructive"
        });
        return;
      }

      if (supabaseKey.length < 20) {
        toast({
          title: "Invalid Key Format",
          description: "The Supabase key appears to be too short. Please check your anon key.",
          variant: "destructive"
        });
        return;
      }

      // Save Supabase credentials using our helper function
      const savedSuccessfully = saveSupabaseCredentials(supabaseUrl, supabaseKey);

      // Clear the client cache so new credentials are used
      clearClientCache();

      if (!savedSuccessfully) {
        toast({
          title: "Storage Error",
          description: "Could not save credentials to browser storage. Please check your browser settings.",
          variant: "destructive"
        });
        return;
      }

      // Test the connection before finalizing
      setIsConnectionTesting(true);
      const isConnected = await testSupabaseConnection();
      setIsConnectionTesting(false);

      if (!isConnected) {
        toast({
          title: "Supabase Connection Failed",
          description: "Could not connect to Supabase with the provided credentials. Your settings have been saved, but you may need to fix your connection details.",
          variant: "destructive"
        });
        // Still proceed with saving, but warn the user
      }

      // Check if table exists - but don't block saving if it doesn't
      const client = createSupabaseClient();
      const tableExists = await checkTableExists(client);

      if (!tableExists) {
        toast({
          title: "Supabase Table Required",
          description: "Your Supabase connection works, but the prompts table doesn't exist. Please create it for full functionality.",
          variant: "destructive"
        });
        setShowSqlSetup(true);
        // Still proceed with saving
      }
    } else {
      toast({
        title: "Supabase Configuration Required",
        description: "Please enter your Supabase URL and API Key for cloud storage.",
        variant: "destructive"
      });
      return;
    }

    // Save system prompt settings
    if (useDefaultSystemPrompt) {
      setUseDefaultPrompt(true);
    } else {
      setUseDefaultPrompt(false);
      saveSystemPrompt(customSystemPrompt);
    }

    toast({
      title: "Settings Saved",
      description: "Your Supabase settings have been updated."
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Settings
          </DialogTitle>
          <DialogDescription>
            Configure how you want to store and access your prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Supabase Configuration */}
            <div className="space-y-6">



              <div className="space-y-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="h-4 w-4" style={{ color: "var(--accent-cyan)" }} />
                    <h3 className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>Supabase Configuration</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your Supabase project URL and anon key to connect to your own Supabase instance
                  </p>

                  <div className="p-3 rounded-xl" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.20)" }}>
                    <div className="flex items-start gap-2">
                      <div className="text-blue-500 mt-0.5">ℹ️</div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: "var(--accent-cyan)" }}>
                          Important: Browser Refresh Required
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                          After connecting to Supabase, <strong>refresh the page</strong> to see your prompts appear.
                          This is especially important when switching browsers or using a new device.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="supabase-url">Supabase Project URL</Label>
                      <Input
                        id="supabase-url"
                        placeholder="https://your-project.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                      <Input
                        id="supabase-key"
                        type="password"
                        placeholder="your-anon-key"
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="custom-user-id">Custom User ID (Optional)</Label>
                      <Input
                        id="custom-user-id"
                        placeholder="Enter a custom user ID to sync across browsers"
                        value={customUserId}
                        onChange={(e) => handleCustomUserIdChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current User ID: <span className="font-mono" style={{ color: "var(--accent-cyan)" }}>{currentUserId || 'Loading...'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        💡 Set a custom user ID to access your prompts from any browser. Leave empty for device-specific storage.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={isConnectionTesting || !supabaseUrl || !supabaseKey}
                      className="flex gap-2 items-center transition-all duration-200"
                      style={{
                        background: "rgba(34,211,238,0.12)",
                        border: "1px solid rgba(34,211,238,0.35)",
                        color: "#22d3ee",
                        boxShadow: "0 0 10px rgba(34,211,238,0.12)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.22)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(34,211,238,0.32)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.12)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(34,211,238,0.12)";
                      }}
                    >
                      {isConnectionTesting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <DatabaseIcon className="h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearSupabaseCredentials();
                        setSupabaseUrl("");
                        setSupabaseKey("");
                        setConnectionStatus("untested");
                        setTableStatus("unknown");
                        setShowSqlSetup(false);
                        setShowDiagnostics(false);
                        toast({
                          title: "Connection Reset",
                          description: "Supabase credentials have been cleared. You can now enter new credentials."
                        });
                      }}
                      className="flex gap-2 items-center transition-all duration-200"
                      style={{
                        background: "rgba(251,191,36,0.12)",
                        border: "1px solid rgba(251,191,36,0.35)",
                        color: "#fbbf24",
                        boxShadow: "0 0 10px rgba(251,191,36,0.12)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.22)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(251,191,36,0.32)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.12)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(251,191,36,0.12)";
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDiagnoseConnection}
                      disabled={isDiagnosing || !supabaseUrl || !supabaseKey}
                      className="flex gap-2 items-center transition-all duration-200"
                      style={{
                        background: "rgba(244,63,142,0.12)",
                        border: "1px solid rgba(244,63,142,0.35)",
                        color: "#f43f8e",
                        boxShadow: "0 0 10px rgba(244,63,142,0.12)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(244,63,142,0.22)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(244,63,142,0.32)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(244,63,142,0.12)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(244,63,142,0.12)";
                      }}
                    >
                      {isDiagnosing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Diagnosing...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Diagnose
                        </>
                      )}
                    </Button>



                    {connectionStatus === "success" && (
                      <div className="flex items-center text-sm text-green-600 gap-1 ml-auto">
                        <CheckCircle className="h-4 w-4" />
                        <span>Connected</span>
                      </div>
                    )}

                    {connectionStatus === "failed" && (
                      <div className="flex items-center text-sm text-red-600 gap-1 ml-auto">
                        <AlertCircle className="h-4 w-4" />
                        <span>Failed</span>
                      </div>
                    )}
                  </div>

                {showDiagnostics && diagnosticsData && (
                  <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium mb-2">Connection Diagnostics</h4>
                        <div className="text-xs space-y-1">
                          <div className="grid grid-cols-2 gap-1">
                            <span className="text-muted-foreground">Network Connectivity:</span>
                            <span className={diagnosticsData.networkConnectivity ? "text-green-600" : "text-red-600"}>
                              {diagnosticsData.networkConnectivity ? "OK" : "Failed"}
                            </span>

                            <span className="text-muted-foreground">CORS Issues:</span>
                            <span className={!diagnosticsData.corsIssue ? "text-green-600" : "text-red-600"}>
                              {!diagnosticsData.corsIssue ? "None" : "Detected"}
                            </span>

                            <span className="text-muted-foreground">Auth Connection:</span>
                            <span className={diagnosticsData.authConnection ? "text-green-600" : "text-red-600"}>
                              {diagnosticsData.authConnection ? "OK" : "Failed"}
                            </span>

                            <span className="text-muted-foreground">Data Connection:</span>
                            <span className={diagnosticsData.dataConnection ? "text-green-600" : "text-red-600"}>
                              {diagnosticsData.dataConnection ? "OK" : "Failed"}
                            </span>

                            <span className="text-muted-foreground">Table Exists:</span>
                            <span className={diagnosticsData.tableExists ? "text-green-600" : "text-amber-600"}>
                              {diagnosticsData.tableExists ? "Yes" : "No"}
                            </span>
                          </div>

                          {diagnosticsData.error && (
                            <div className="mt-2 text-red-600">
                              <span className="font-medium">Error:</span> {diagnosticsData.error}
                            </div>
                          )}

                          <div className="mt-2">
                            <span className="font-medium">Recommendation:</span>{" "}
                            {diagnosticsData.corsIssue ? (
                              <span>Check your browser's CORS settings or try a different browser.</span>
                            ) : !diagnosticsData.networkConnectivity ? (
                              <span>Check your internet connection.</span>
                            ) : !diagnosticsData.authConnection ? (
                              <span>Verify your Supabase URL and API key.</span>
                            ) : !diagnosticsData.dataConnection ? (
                              <span>Verify your database permissions.</span>
                            ) : !diagnosticsData.tableExists ? (
                              <span>Create the prompts table using the SQL below.</span>
                            ) : (
                              <span>Your connection appears to be working correctly.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-xs transition-all duration-200"
                      onClick={() => setShowDiagnostics(false)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "rgba(255,255,255,0.65)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      }}
                    >
                      Hide Diagnostics
                    </Button>
                  </div>
                )}

                {showSqlSetup && (
                  <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.20)" }}>
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium" style={{ color: "var(--accent-yellow)" }}>Table Setup Required</h4>
                        <p className="text-xs mt-1" style={{ color: "var(--text-soft)" }}>
                          Your Supabase connection works, but you need to create the 'prompts' table manually in your Supabase SQL editor:
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-2">
                      <pre className="text-xs p-2 bg-gray-800 text-gray-100 rounded-md overflow-x-auto">{CREATE_TABLE_SQL.trim()}</pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={handleCopySql}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <p className="text-xs font-medium" style={{ color: "var(--accent-yellow)" }}>
                        📋 Quick Setup Steps:
                      </p>
                      <ol className="text-xs list-decimal pl-4 space-y-1" style={{ color: "var(--text-soft)" }}>
                        <li>Click the "Open SQL Editor" button below</li>
                        <li>Create a new query in the SQL Editor</li>
                        <li>Copy the SQL code above (click the copy button)</li>
                        <li>Paste it into the SQL Editor</li>
                        <li>Click "Run" to execute the SQL</li>
                        <li>Return here and click "Connect" to verify</li>
                      </ol>

                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs flex items-center gap-1 transition-all duration-200"
                          style={{
                            background: "rgba(251,191,36,0.12)",
                            border: "1px solid rgba(251,191,36,0.35)",
                            color: "#fbbf24",
                            boxShadow: "0 0 10px rgba(251,191,36,0.12)",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.22)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(251,191,36,0.32)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.12)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(251,191,36,0.12)";
                          }}
                          onClick={openSupabaseSqlEditor}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open SQL Editor
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs flex items-center gap-1 transition-all duration-200"
                          style={{
                            background: "rgba(251,191,36,0.12)",
                            border: "1px solid rgba(251,191,36,0.35)",
                            color: "#fbbf24",
                            boxShadow: "0 0 10px rgba(251,191,36,0.12)",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.22)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(251,191,36,0.32)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.12)";
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(251,191,36,0.12)";
                          }}
                          onClick={handleCopySql}
                        >
                          <Copy className="h-3 w-3" />
                          Copy SQL
                        </Button>
                      </div>

                      <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
                        <p className="font-medium mb-1" style={{ color: "var(--accent-cyan)" }}>💡 Why manual setup?</p>
                        <p style={{ color: "var(--text-soft)" }}>
                          Supabase doesn't allow automatic table creation through the API for security reasons.
                          This one-time manual setup ensures your database is properly configured.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                  <div className="text-xs text-muted-foreground">
                    <p className="mb-2">To find your Supabase details:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Navigate to Project Settings → API</li>
                      <li>Copy the "Project URL" and "anon" public API key</li>
                    </ol>
                  </div>
                </div>
            </div>

            {/* Right Column - AI Assistant Configuration */}
            <div className="space-y-6">
              <div className="space-y-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: "var(--accent-rose)" }} />
                  <h3 className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>AI Assistant Configuration</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customize the system prompt used by the AI Assistant to generate prompts
                </p>

                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="use-default-prompt"
                    checked={useDefaultSystemPrompt}
                    onCheckedChange={(checked) => {
                      setUseDefaultSystemPrompt(checked as boolean);
                    }}
                  />
                  <Label htmlFor="use-default-prompt" className="text-sm">
                    Use default system prompt
                  </Label>
                </div>

                <div className={useDefaultSystemPrompt ? "opacity-50" : ""}>
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="system-prompt" className="text-sm">
                      System Prompt
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetSystemPrompt}
                      className="h-6 text-xs flex items-center gap-1 text-muted-foreground"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to default
                    </Button>
                  </div>
                  <Textarea
                    id="system-prompt"
                    value={customSystemPrompt}
                    onChange={(e) => setCustomSystemPrompt(e.target.value)}
                    className="min-h-[200px] resize-y"
                    placeholder="Enter a system prompt for the AI Assistant"
                    disabled={useDefaultSystemPrompt}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This prompt defines how the AI Assistant generates prompts based on your requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="transition-all duration-200"
            style={{
              background: "rgba(244,63,142,0.10)",
              border: "1px solid rgba(244,63,142,0.30)",
              color: "#f43f8e",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(244,63,142,0.20)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(244,63,142,0.30)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(244,63,142,0.10)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Cancel
          </Button>
          <ShinyButton
            onClick={handleSave}
            hex="#22d3ee"
          >
            Save Changes
          </ShinyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
