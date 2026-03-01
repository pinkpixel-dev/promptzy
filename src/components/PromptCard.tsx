import { useState } from "react";
import { Prompt } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, Trash, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
}

export default function PromptCard({ prompt, onEdit, onDelete }: PromptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const promptType = prompt.type || "task";

  const toggleExpanded = () => setExpanded(!expanded);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(prompt);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(prompt.id);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.text);
      toast({ title: "Copied!", description: "Prompt copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const firstLine = prompt.text.split("\n")[0];
  const previewText = firstLine.length > 90 ? firstLine.substring(0, 90) + "…" : firstLine;

  // Badge class per type
  const badgeClass =
    promptType === "system" ? "badge-system"
    : promptType === "task" ? "badge-task"
    : promptType === "image" ? "badge-image"
    : "badge-video";

  const typeLabel =
    promptType === "system" ? "SYSTEM"
    : promptType === "task" ? "TASK"
    : promptType === "image" ? "IMAGE"
    : "VIDEO";

  return (
    <div className="prompt-card overflow-hidden animate-fade-in">
      <div className="p-4 flex flex-col gap-2 btn-hover-effect">
        {/* Type badge row */}
        <div className="flex items-center justify-between">
          <span className={`${badgeClass} text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase`}>
            {typeLabel}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-soft)" }}>
            {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Preview + actions */}
        <div className="flex justify-between items-start gap-2">
          <div
            className="flex-1 overflow-hidden text-sm cursor-pointer"
            onClick={toggleExpanded}
          >
            <p className="font-medium leading-snug line-clamp-2" style={{ color: "var(--text-strong)" }}>
              {previewText}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
              onClick={handleCopy}
              title="Copy prompt"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors"
              onClick={handleEdit}
              title="Edit prompt"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
              onClick={handleDelete}
              title="Delete prompt"
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {prompt.tags.map((tag) => (
              <span key={tag.id} className="tag">{tag.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded text */}
      {expanded && (
        <div className="px-4 pb-4 animate-accordion-down">
          <div
            className="p-3 rounded-xl whitespace-pre-wrap text-sm font-mono leading-relaxed"
            style={{
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "var(--text-strong)",
            }}
          >
            {prompt.text}
          </div>
        </div>
      )}
    </div>
  );
}
