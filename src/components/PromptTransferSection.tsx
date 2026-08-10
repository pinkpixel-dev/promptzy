import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getPrompts, syncPrompts } from "@/lib/supabase/prompts";
import { buildExportFilename, parseImport, serializeExport } from "@/lib/supabase/transfer";
import type { Prompt } from "@/types";

interface PendingImport {
  prompts: Prompt[];
  skipped: string[];
  filename: string;
}

/**
 * Download and restore the prompt library as JSON.
 *
 * Worth having on its own, and worth having before an upgrade: prompts are only
 * ever as safe as the last copy you took off the database.
 */
const PromptTransferSection: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const prompts = await getPrompts();

      if (prompts.length === 0) {
        toast({
          title: "Nothing to export",
          description: "You have no prompts saved yet.",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([serializeExport(prompts)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildExportFilename();
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Prompts exported",
        description: `Saved ${prompts.length} prompt${prompts.length === 1 ? "" : "s"} to ${link.download}.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not export your prompts.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so choosing the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    try {
      const { prompts, skipped } = parseImport(await file.text());
      setPending({ prompts, skipped, filename: file.name });
    } catch (error) {
      toast({
        title: "Could not read that file",
        description: error instanceof Error ? error.message : "Unrecognised file.",
        variant: "destructive",
      });
    }
  };

  const confirmImport = async () => {
    if (!pending) return;

    const { prompts } = pending;
    setPending(null);
    setIsImporting(true);

    try {
      const { synced, failed } = await syncPrompts(prompts);

      if (failed > 0) {
        toast({
          title: synced > 0 ? "Imported with problems" : "Import failed",
          description: `${synced} imported, ${failed} could not be saved. Check the console for details.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Prompts imported",
        description: `${synced} prompt${synced === 1 ? "" : "s"} added. Refresh to see them.`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const isBusy = isExporting || isImporting;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isBusy}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {isExporting ? "Exporting..." : "Export prompts"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {isImporting ? "Importing..." : "Import prompts"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Downloads your prompts as a JSON file you can keep. Import accepts that file, or raw table
        rows exported from the Supabase SQL editor.
      </p>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent
          style={{
            background: "hsl(215,25%,12%)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import {pending?.prompts.length} prompt{pending?.prompts.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  From <span className="font-mono">{pending?.filename}</span>. Prompts are added to
                  your account. An imported prompt that shares an id with one you already have will
                  replace it.
                </p>
                {pending && pending.skipped.length > 0 && (
                  <p style={{ color: "var(--accent-yellow)" }}>
                    {pending.skipped.length} entr
                    {pending.skipped.length === 1 ? "y" : "ies"} will be skipped:{" "}
                    {pending.skipped.slice(0, 3).join(" ")}
                    {pending.skipped.length > 3 ? " ..." : ""}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromptTransferSection;
