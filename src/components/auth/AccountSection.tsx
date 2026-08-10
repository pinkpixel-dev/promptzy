import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/supabase/auth";
import type { User } from "@supabase/supabase-js";

interface AccountSectionProps {
  /** Re-checked whenever the dialog opens, so the panel never shows a stale account. */
  refreshToken?: unknown;
}

/**
 * Shows who is signed in and offers a way out.
 *
 * This replaces the old "Custom User ID" field. That field let anyone type any
 * identifier and immediately read whatever was stored under it, which is the
 * behaviour that made prompts readable across accounts.
 */
const AccountSection: React.FC<AccountSectionProps> = ({ refreshToken }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser().then((current) => {
      if (!cancelled) setUser(current);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setUser(null);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <p className="text-xs text-muted-foreground">
        Not signed in. Close settings to sign in or create your account.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <UserRound className="h-4 w-4 shrink-0" style={{ color: "var(--accent-cyan)" }} aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm" style={{ color: "var(--text-strong)" }}>
            {user.email}
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in. Your prompts sync to any device you sign in from.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
};

export default AccountSection;
