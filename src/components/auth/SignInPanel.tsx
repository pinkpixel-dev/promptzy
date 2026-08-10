import React, { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import ShinyButton from "@/components/ShinyButton";
import {
  describeEmailProblem,
  describePasswordProblem,
  signIn,
  signUp,
} from "@/lib/supabase/auth";

type Mode = "signin" | "signup";

interface SignInPanelProps {
  /** Opens Settings, so someone can point the app at a different project. */
  onOpenSettings: () => void;
}

/**
 * Email and password sign-in.
 *
 * The account lives in the user's own Supabase project. Signing in produces the
 * JWT that the RLS policies check, which is what scopes prompts to one person.
 */
const SignInPanel: React.FC<SignInPanelProps> = ({ onOpenSettings }) => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const feedbackId = useId();

  const isSignUp = mode === "signup";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const emailProblem = describeEmailProblem(email);
    if (emailProblem) {
      setError(emailProblem);
      return;
    }

    const passwordProblem = describePasswordProblem(password);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }

    setIsBusy(true);
    try {
      const result = isSignUp ? await signUp(email, password) : await signIn(email, password);

      if (!result.ok) {
        setError(result.error ?? "That did not work. Try again.");
        return;
      }

      if (result.needsEmailConfirmation) {
        setNotice(
          "Account created. Check your email for a confirmation link, then sign in. " +
            "You can turn confirmation off in your Supabase project under Authentication → Sign In / Providers.",
        );
        setMode("signin");
        setPassword("");
      }
      // On success the auth listener in AuthGate swaps this panel out.
    } finally {
      setIsBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isSignUp ? "signin" : "signup");
    setError(null);
    setNotice(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isBusy}
          aria-describedby={error || notice ? feedbackId : undefined}
          aria-invalid={Boolean(error)}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignUp ? "At least 6 characters" : "Your password"}
          disabled={isBusy}
          aria-describedby={error || notice ? feedbackId : undefined}
          aria-invalid={Boolean(error)}
          className="h-11"
        />
      </div>

      {(error || notice) && (
        <p
          id={feedbackId}
          role="alert"
          className="flex items-start gap-2 text-sm"
          style={{ color: error ? "var(--accent-rose)" : "var(--accent-cyan)" }}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{error ?? notice}</span>
        </p>
      )}

      <ShinyButton
        type="submit"
        hex="#22d3ee"
        disabled={isBusy}
        className="w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-2">
          {isBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSignUp ? "Create account" : "Sign in"}
        </span>
      </ShinyButton>

      <div className="flex flex-col gap-2 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={switchMode}
          disabled={isBusy}
          className="rounded-md px-1 py-1 text-left underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          style={{ color: "var(--text-soft)", outlineColor: "var(--accent-cyan)" }}
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          disabled={isBusy}
          className="rounded-md px-1 py-1 text-left underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 sm:text-right"
          style={{ color: "var(--text-soft)", outlineColor: "var(--accent-cyan)" }}
        >
          Use a different project
        </button>
      </div>
    </form>
  );
};

export default SignInPanel;
