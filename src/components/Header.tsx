import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, RefreshCw, BookOpen } from "lucide-react";
import SettingsDialog from "@/components/SettingsDialog";
import AnimatedLogo from "@/components/AnimatedLogo";
import ShinyButton from "@/components/ShinyButton";

interface HeaderProps {
  onAddPrompt: () => void;
  onRefreshPrompts: () => void;
  isRefreshing: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAddPrompt, onRefreshPrompts, isRefreshing }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="glass glass__bar rounded-1xl px-5 py-4 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
      <div className="flex items-center gap-3">
        <AnimatedLogo />
        <div className="flex flex-col leading-tight">
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{
              color: "var(--accent-rose)",
            }}
          >
            Promptzy
          </h1>
          <span className="text-xs" style={{ color: "var(--text-soft)" }}>Your AI prompt library</span>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshPrompts}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 flex-1 sm:flex-none transition-all duration-200"
          style={{
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.35)",
            color: "#22d3ee",
            boxShadow: "0 0 6px rgba(34,211,238,0.10)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.22)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(34,211,238,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.12)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 6px rgba(34,211,238,0.10)";
          }}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden xs:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://promptzy-docs.pinkpixel.dev', '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-1.5 flex-1 sm:flex-none transition-all duration-200"
          title="Documentation"
          style={{
            background: "rgba(244,63,142,0.12)",
            border: "1px solid rgba(244,63,142,0.35)",
            color: "#f43f8e",
            boxShadow: "0 0 6px rgba(244,63,142,0.10)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(244,63,142,0.22)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(244,63,142,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(244,63,142,0.12)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 6px rgba(244,63,142,0.10)";
          }}
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden xs:inline">Docs</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1.5 flex-1 sm:flex-none transition-all duration-200"
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.35)",
            color: "#fbbf24",
            boxShadow: "0 0 6px rgba(251,191,36,0.10)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.22)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(251,191,36,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.12)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 6px rgba(251,191,36,0.10)";
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden xs:inline">Settings</span>
        </Button>

        <ShinyButton
          onClick={onAddPrompt}
          hex="#22d3ee"
          size="sm"
          className="flex-1 sm:flex-none"
        >
          <Plus className="h-4 w-4" />
          Add Prompt
        </ShinyButton>
      </div>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
};

export default Header;
