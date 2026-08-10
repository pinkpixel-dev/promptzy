import React from "react";
import { Database, ExternalLink } from "lucide-react";
import ShinyButton from "@/components/ShinyButton";

interface SupabaseSetupNoticeProps {
  onOpenSettings: () => void;
}

const STEPS = [
  "Create a free project at supabase.com.",
  "Copy its Project URL and anon key from Project Settings → API.",
  "Paste both into Promptzy's settings, then run the setup script in the Supabase SQL Editor.",
  "Create your Promptzy account and your prompts are ready to sync.",
];

/**
 * Shown when no Supabase project is configured.
 *
 * Promptzy has no built-in database to fall back on, by design: prompts belong
 * in a project the user controls, not one the app picked for them.
 */
const SupabaseSetupNotice: React.FC<SupabaseSetupNoticeProps> = ({ onOpenSettings }) => (
  <div className="space-y-5">
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(34,211,238,0.12)", color: "var(--accent-cyan)" }}
      >
        <Database className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>
          Connect a Supabase project
        </h2>
        <p className="text-sm" style={{ color: "var(--text-soft)" }}>
          Promptzy stores your prompts in your own Supabase project. Nothing is stored anywhere else,
          and there is no shared database to fall back on.
        </p>
      </div>
    </div>

    <ol className="space-y-2.5 text-sm" style={{ color: "var(--text-soft)" }}>
      {STEPS.map((step, index) => (
        <li key={step} className="flex gap-3">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-strong)" }}
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>

    <div className="flex flex-col gap-3 sm:flex-row">
      <ShinyButton
        hex="#22d3ee"
        onClick={onOpenSettings}
        className="justify-center whitespace-nowrap px-5"
      >
        Open settings
      </ShinyButton>

      <a
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[18px] px-5 py-3 text-base transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          color: "var(--text-soft)",
          border: "1px solid rgba(255,255,255,0.14)",
          outlineColor: "var(--accent-cyan)",
        }}
      >
        Supabase dashboard
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    </div>
  </div>
);

export default SupabaseSetupNotice;
