
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

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
        <Button
          onClick={onAddPrompt}
          className="font-bold transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #22d3ee 0%, #fbbf24 50%, #f43f8e 100%)",
            border: "none",
            color: "hsl(215,28%,9%)",
            boxShadow: "0 0 20px rgba(34,211,238,0.40), 0 0 40px rgba(251,191,36,0.20), 0 2px 8px rgba(0,0,0,0.40)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(34,211,238,0.55), 0 0 50px rgba(251,191,36,0.30), 0 4px 12px rgba(0,0,0,0.45)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(34,211,238,0.40), 0 0 40px rgba(251,191,36,0.20), 0 2px 8px rgba(0,0,0,0.40)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add your first prompt
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
