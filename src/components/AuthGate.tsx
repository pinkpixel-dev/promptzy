import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsDialog from "@/components/SettingsDialog";
import SignInPanel from "@/components/auth/SignInPanel";
import SupabaseSetupNotice from "@/components/auth/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { getCurrentSession, onAuthStateChange } from "@/lib/supabase/auth";

type GateState = "checking" | "unconfigured" | "signed-out" | "ready";

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * Decides whether the app is usable yet.
 *
 * Three things must be true before prompts can load: a Supabase project is
 * configured, we can reach it, and someone is signed in. Anything less renders
 * the matching setup step instead of the app, because without a session the
 * RLS policies correctly return nothing at all.
 */
const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  // `checking` until the first session lookup resolves, so we never flash the
  // sign-in screen at someone who is already signed in.
  const [state, setState] = useState<GateState>("checking");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Bumped to re-run the check after Settings closes, since credentials may
  // have changed while it was open.
  const [recheckNonce, setRecheckNonce] = useState(0);
  const hasAutoOpenedSettings = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const session = await getCurrentSession();
      if (cancelled) return;

      if (!isSupabaseConfigured()) {
        setState("unconfigured");
        // Nudge straight into Settings the first time, since a setup screen
        // with no obvious next step is a dead end. Only once, though: closing
        // the dialog re-runs this check, and reopening every time would trap
        // someone who just wants to read the setup steps behind it.
        if (!hasAutoOpenedSettings.current) {
          hasAutoOpenedSettings.current = true;
          setIsSettingsOpen(true);
        }
        return;
      }

      setState(session ? "ready" : "signed-out");
    };

    void resolve();
    const unsubscribe = onAuthStateChange(() => {
      void resolve();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [recheckNonce]);

  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
    setRecheckNonce((value) => value + 1);
  }, []);

  if (state === "ready") return <>{children}</>;

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-strong)" }}>
              Promptzy
            </h1>
            <p className="text-sm" style={{ color: "var(--text-soft)" }}>
              Your prompts, in your own database.
            </p>
          </div>
        </div>

        <div className="glass p-6">
          {state === "checking" && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--text-soft)" }} role="status">
              Checking your connection...
            </p>
          )}

          {state === "unconfigured" && (
            <SupabaseSetupNotice onOpenSettings={() => setIsSettingsOpen(true)} />
          )}

          {state === "signed-out" && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>
                  Sign in
                </h2>
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                  Your account lives in your Supabase project. Sign in on any device to reach the
                  same prompts.
                </p>
              </div>
              <SignInPanel onOpenSettings={() => setIsSettingsOpen(true)} />
            </div>
          )}
        </div>
      </div>

      <SettingsDialog isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </div>
  );
};

export default AuthGate;
