
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import ShinyButton from "@/components/ShinyButton";

interface EmptyStateProps {
  onAddPrompt: () => void;
  isFiltered: boolean;
}

const EmptyState = ({ onAddPrompt, isFiltered }: EmptyStateProps) => {
  return (
    <div
      className="glass flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in"
      style={{ borderStyle: "dashed" }}
    >
      {/* Icon bubble */}
      <div
        className="mb-5 flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{
          background: "rgba(34,211,238,0.10)",
          border: "1px solid rgba(34,211,238,0.22)",
          boxShadow: "0 0 20px rgba(34,211,238,0.15)",
        }}
      >
        <Sparkles className="w-8 h-8" style={{ color: "var(--accent-cyan)" }} />
      </div>

      <h3
        className="text-xl font-semibold mb-2"
        style={{ color: "var(--text-strong)" }}
      >
        {isFiltered ? "No matching prompts" : "No prompts yet"}
      </h3>

      <p className="mb-7 max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
        {isFiltered
          ? "Try adjusting your search term or clearing some tag filters."
          : "Add your first AI prompt and start building your personal library."}
      </p>

      {!isFiltered && (
        <ShinyButton
          onClick={onAddPrompt}
          hex="#f43f8e"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add your first prompt
        </ShinyButton>
      )}
    </div>
  );
};

export default EmptyState;
