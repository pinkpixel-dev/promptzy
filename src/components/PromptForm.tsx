import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import TagInput from "./TagInput";
import { Prompt, Tag } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ShinyButton from "@/components/ShinyButton";

interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
  editingPrompt: Prompt | null;
}

const PromptForm = ({ isOpen, onClose, onSave, editingPrompt }: PromptFormProps) => {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [type, setType] = useState<"system" | "task" | "image" | "video">("task");
  const { toast } = useToast();

  useEffect(() => {
    if (editingPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(editingPrompt.text);
      // Only copy tags if the prompt has an id (meaning it's not a new AI-generated prompt)
      setTags(editingPrompt.tags ? [...editingPrompt.tags] : []);
      // Set type if it exists, otherwise default to task
      setType(editingPrompt.type || "task");
    } else {
      setText("");
      setTags([]);
      setType("task");
    }
  }, [editingPrompt, isOpen]);

  const handleAddTag = (tag: Tag) => {
    // Check if tag already exists
    if (!tags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Prompt text cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Make sure we have a valid prompt object with all required fields
    const promptData: Prompt = {
      // Generate a UUID for new prompts to satisfy Supabase UUID requirements
      id: editingPrompt?.id && editingPrompt.id !== "" ? editingPrompt.id : crypto.randomUUID(),
      text: text.trim(),
      tags: tags || [], // Ensure tags is an array (even if empty)
      type: type,
      createdAt: editingPrompt?.createdAt && editingPrompt.id !== "" ? editingPrompt.createdAt : new Date().toISOString(),
    };

    // Debug log to see what's being saved
    console.log("Saving prompt:", promptData);
    
    onSave(promptData);
    toast({
      title: editingPrompt?.id ? "Prompt updated" : "Prompt added",
      description: editingPrompt?.id 
        ? "Your prompt has been successfully updated" 
        : "Your prompt has been successfully added",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingPrompt?.id ? "Edit Prompt" : "Add New Prompt"}
          </DialogTitle>
          <DialogDescription>
            {editingPrompt?.id
              ? "Modify your existing prompt and update its tags and type."
              : "Create a new prompt by entering the text, selecting a type, and adding relevant tags."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Prompt Type</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(value) => setType(value as "system" | "task" | "image" | "video")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="prompt-system" />
                <Label htmlFor="prompt-system">System Prompt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="task" id="prompt-task" />
                <Label htmlFor="prompt-task">Task Prompt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="image" id="prompt-image" />
                <Label htmlFor="prompt-image">Image Prompt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="prompt-video" />
                <Label htmlFor="prompt-video">Video Prompt</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Text</Label>
            <Textarea
              id="prompt"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your prompt text here…"
              className="min-h-[150px] font-mono text-sm"
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "var(--text-strong)",
                borderRadius: "12px",
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput
              tags={tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
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
            onClick={handleSubmit}
            hex="#fbbf24"
          >
            {editingPrompt?.id ? "Update Prompt" : "Save Prompt"}
          </ShinyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptForm;
