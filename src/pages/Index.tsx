import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import TagFilter from "@/components/TagFilter";
import PromptCard from "@/components/PromptCard";
import EmptyState from "@/components/EmptyState";
import PromptForm from "@/components/PromptForm";
import AIAssistant from "@/components/AIAssistant";
import { Prompt, Tag } from "@/types";
import { getPromptsFromSupabase, savePromptToSupabase, deletePromptFromSupabase, testSupabaseConnection } from "@/lib/supabasePromptStore";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseClient } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const Index = () => {
  // Create a fresh Supabase client to handle authentication (memoized to prevent recreation)
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { toast } = useToast();

  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [suppressDeleteConfirm, setSuppressDeleteConfirm] = useState<boolean>(false);

  // Responsive Masonry: calculate number of columns based on breakpoints
  const [colCount, setColCount] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 768px)").matches) return 2;
    return 1;
  });
  useEffect(() => {
    const updateCols = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setColCount(3);
      else if (window.matchMedia("(min-width: 768px)").matches) setColCount(2);
      else setColCount(1);
    };
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  // Function to check Supabase connection status
  const checkSupabaseConnection = useCallback(async () => {
    try {
      const isConnected = await testSupabaseConnection();
      setSupabaseConnected(isConnected);
      return isConnected;
    } catch (error) {
      console.error("Error checking Supabase connection:", error);
      setSupabaseConnected(false);
      return false;
    }
  }, []);

  // Check Supabase auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      checkSupabaseConnection();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      checkSupabaseConnection();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSupabaseConnection, supabase.auth]);

  // Function to load prompts from Supabase (extracted for reuse)
  const loadPrompts = useCallback(async (forceRefresh = false) => {
    console.log("Loading prompts from Supabase, connected:", supabaseConnected, "forceRefresh:", forceRefresh);

    if (!supabaseConnected && !forceRefresh) {
      console.log("Supabase not connected, skipping prompt load");
      return;
    }

    try {
      const supabasePrompts = await getPromptsFromSupabase();
      console.log(`Retrieved ${supabasePrompts.length} prompts from Supabase`);

      setPrompts(supabasePrompts);
      // Extract unique tags from prompts
      const tagsFromSupabase = supabasePrompts.flatMap(p => p.tags);
      const uniqueTags = Array.from(
        new Map(tagsFromSupabase.map(tag => [tag.id, tag])).values()
      );
      setAllTags(uniqueTags);

      // Force a re-render by updating a timestamp or counter
      console.log("Prompts state updated with", supabasePrompts.length, "prompts");
    } catch (error) {
      console.error("Error loading prompts from Supabase:", error);
      toast({
        title: "Error loading prompts",
        description: "Could not load prompts from Supabase. Please check your connection.",
        variant: "destructive",
      });
    }
  }, [supabaseConnected, toast]);

  // Load prompts from Supabase on mount and connection changes
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Function to handle manual refresh
  const handleRefreshPrompts = useCallback(async () => {
    setIsRefreshing(true);
    console.log("Manual refresh triggered");

    try {
      // Clear current prompts to show loading state
      setPrompts([]);
      setAllTags([]);

      // Re-check Supabase connection first
      console.log("Checking Supabase connection...");
      const isConnected = await checkSupabaseConnection();

      if (!isConnected) {
        console.log("Connection check failed");
        toast({
          title: "Connection Failed",
          description: "Could not connect to Supabase. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      console.log("Connection successful, loading prompts...");
      // Force refresh prompts regardless of connection state
      await loadPrompts(true);

      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force a re-render by updating the refresh key
      setRefreshKey(prev => prev + 1);

      toast({
        title: "Prompts Refreshed",
        description: "Successfully refreshed prompts from Supabase.",
      });
    } catch (error) {
      console.error("Error refreshing prompts:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh prompts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [checkSupabaseConnection, loadPrompts, toast]);

  const handleAddPrompt = () => {
    setEditingPrompt(null);
    setIsFormOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  const handleSavePrompt = async (promptData: Prompt) => {
    // Ensure promptData has all required fields
    const completePromptData: Prompt = {
      id: promptData.id || crypto.randomUUID(),
      text: promptData.text,
      tags: promptData.tags || [],
      type: promptData.type || "task",
      createdAt: promptData.createdAt || new Date().toISOString(),
    };

    if (!supabaseConnected) {
      toast({
        title: "Supabase not connected",
        description: "Please check your Supabase connection in settings",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save to Supabase
      await savePromptToSupabase(completePromptData);

      // Update state
      const updatedPrompts = editingPrompt?.id
        ? prompts.map(p => p.id === completePromptData.id ? completePromptData : p)
        : [completePromptData, ...prompts];

      setPrompts(updatedPrompts);

      // Update tags from current prompts
      const tagsFromPrompts = updatedPrompts.flatMap(p => p.tags);
      const uniqueTags = Array.from(
        new Map(tagsFromPrompts.map(tag => [tag.id, tag])).values()
      );
      setAllTags(uniqueTags);

      toast({
        title: "Prompt saved",
        description: "Your prompt has been saved to Supabase",
      });
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      toast({
        title: "Error saving prompt",
        description: "Could not save prompt to Supabase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!supabaseConnected) {
      toast({
        title: "Supabase not connected",
        description: "Please check your Supabase connection in settings",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete from Supabase
      await deletePromptFromSupabase(id);

      // Update state
      const updatedPrompts = prompts.filter(p => p.id !== id);
      setPrompts(updatedPrompts);

      // Update tags from remaining prompts
      const tagsFromPrompts = updatedPrompts.flatMap(p => p.tags);
      const uniqueTags = Array.from(
        new Map(tagsFromPrompts.map(tag => [tag.id, tag])).values()
      );
      setAllTags(uniqueTags);

      toast({
        title: "Prompt deleted",
        description: "Your prompt has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting from Supabase:", error);
      toast({
        title: "Error deleting prompt",
        description: "Could not delete prompt from Supabase. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Confirmation handlers
  const handleDeleteClick = (id: string) => {
    if (suppressDeleteConfirm) {
      handleDeletePrompt(id);
    } else {
      setPendingDeleteId(id);
      setIsDeleteConfirmOpen(true);
    }
  };
  const confirmDelete = () => {
    if (pendingDeleteId) {
      handleDeletePrompt(pendingDeleteId);
    }
    setPendingDeleteId(null);
    setIsDeleteConfirmOpen(false);
  };
  const cancelDelete = () => {
    setPendingDeleteId(null);
    setIsDeleteConfirmOpen(false);
  };
  const toggleSuppressDeleteConfirm = (checked: boolean) => {
    setSuppressDeleteConfirm(checked);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prevTags =>
      prevTags.includes(tagId)
        ? prevTags.filter(id => id !== tagId)
        : [...prevTags, tagId]
    );
  };

  const handleUseAIPrompt = (text: string, promptType: "system" | "task" | "image" | "video") => {
    // Create a new prompt with the AI-generated text
    // Generate a temporary ID for the new prompt
    const tempPrompt: Prompt = {
      id: "", // Empty ID because it's not saved yet
      text: text,
      tags: [], // Start with empty tags array
      type: promptType, // Use the selected AI assistant prompt type
      createdAt: ""
    };

    // Open the form with the AI text already populated
    setEditingPrompt(tempPrompt);
    setIsFormOpen(true);
    console.log("Using AI prompt:", tempPrompt);
  };

  const filteredPrompts = prompts.filter(prompt => {
    // Filter by search term
    const matchesSearch = searchTerm
      ? prompt.text.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Filter by selected tags
    const matchesTags = selectedTags.length > 0
      ? selectedTags.every(tagId => prompt.tags.some(tag => tag.id === tagId))
      : true;

    return matchesSearch && matchesTags;
  });

  const isFiltered = searchTerm !== "" || selectedTags.length > 0;

  // Distribute prompts into columns
  const columns = useMemo(() => {
    const cols: Prompt[][] = Array.from({ length: colCount }, () => []);
    filteredPrompts.forEach((p, i) => {
      cols[i % colCount].push(p);
    });
    return cols;
  }, [filteredPrompts, colCount]);

  return (
    <div key={refreshKey} className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Header
          onAddPrompt={handleAddPrompt}
          onRefreshPrompts={handleRefreshPrompts}
          isRefreshing={isRefreshing}
        />

        {/* Search + tags glass panel */}
        <div
          className="glass mb-8 p-5 space-y-4"
        >
          <SearchInput searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
          />
        </div>

        {filteredPrompts.length > 0 ? (
          <div className="flex gap-4 items-start">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-4">
                {col.map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={handleEditPrompt}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState onAddPrompt={handleAddPrompt} isFiltered={isFiltered} />
        )}

        <PromptForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSavePrompt}
          editingPrompt={editingPrompt}
        />

        <AIAssistant onUsePrompt={handleUseAIPrompt} />

        {/* Delete confirmation dialog */}
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent
            style={{
              background: "hsl(215,25%,12%)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt?
            </AlertDialogDescription>
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="suppress-delete-confirm"
                checked={suppressDeleteConfirm}
                onCheckedChange={(val) => toggleSuppressDeleteConfirm(!!val)}
              />
              <Label htmlFor="suppress-delete-confirm">Don't show this again</Label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                style={{
                  background: "linear-gradient(135deg, rgba(251,113,133,0.85) 0%, rgba(34,211,238,0.70) 100%)",
                  color: "hsl(215,28%,9%)",
                  border: "1px solid rgba(251,113,133,0.30)",
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Index;
