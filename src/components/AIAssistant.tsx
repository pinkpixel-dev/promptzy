import { useState, useRef, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIResponse } from "@/types";
import { Bot, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getSystemPrompt } from "@/lib/systemPromptStore";
import ShinyButton from "@/components/ShinyButton";

interface AIAssistantProps {
  onUsePrompt: (text: string, promptType: "system" | "task" | "image" | "video") => void;
}

// Export the default system prompt so it can be used elsewhere
export const SYSTEM_PROMPT_DEFAULT = `You are a prompt generator. Your ONLY job is to output the requested prompt text. Nothing else.

STRICT OUTPUT RULES - FOLLOW EXACTLY:
- Output ONLY the prompt text itself
- NO greetings ("Certainly!", "Here's", "Sure!", etc.)
- NO explanatory text ("Here's a prompt for...", "This prompt will...")
- NO offers to help ("Would you like me to...", "Let me know if...")
- NO labels ("TASK PROMPT:", "Here's your prompt:", etc.)
- NO separators (dashes, lines, formatting)
- NO conversational elements whatsoever
- NO questions back to the user

PROMPT TYPES:
System Prompts: Define AI identity, behavior, tone, constraints, and purpose. Shape how the AI should act.
Task Prompts: Provide specific instructions for the AI to perform an action or generate content.
Image Prompts: Describe visual scenes with composition, style, lighting, mood, and medium details.
Video Prompts: Describe visual sequences with scene layout, actions, transitions, and cinematography.

CRITICAL: Your response must be ONLY the prompt text that can be directly copied and used. Start writing the prompt immediately. No introduction, no conclusion, no extra words.`;

const AIAssistant = ({ onUsePrompt }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptType, setPromptType] = useState<"system" | "task" | "image" | "video">("task");
  const [response, setResponse] = useState<AIResponse>({
    text: "",
    loading: false,
    error: null
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(SYSTEM_PROMPT_DEFAULT);
  const { toast } = useToast();
  const responseRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<{ close: () => void } | null>(null);

  // Load system prompt from storage when component mounts
  useEffect(() => {
    setSystemPrompt(getSystemPrompt());
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const POLLINATIONS_MODEL_DEFAULT = 'gemini-fast';
  const POLLINATIONS_MODEL_KEY = 'pollinations-model';

  const getApiKey = (): string => {
    return (
      (import.meta.env.VITE_POLLINATIONS_API_KEY as string | undefined) ||
      localStorage.getItem('pollinations-api-key') ||
      ''
    );
  };

  const getModel = (): string => {
    return localStorage.getItem(POLLINATIONS_MODEL_KEY) || POLLINATIONS_MODEL_DEFAULT;
  };

  const handleGeneratePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate content",
        variant: "destructive",
      });
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your Pollinations API key in Settings to use AI generation.",
        variant: "destructive",
      });
      return;
    }

    // Clean up any existing event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setResponse({
      text: "",
      loading: true,
      error: null
    });

    try {
      let userPrompt = '';

      if (promptType === "system") {
        userPrompt = `Create a system prompt: ${prompt}. Define the AI's role, personality, and constraints. Output ONLY the prompt text with no greetings, explanations, offers to generate other content, or extra commentary.`;
      } else if (promptType === "task") {
        userPrompt = `Create a task prompt: ${prompt}. Provide specific instructions for the AI. Output ONLY the prompt text with no greetings, explanations, offers to generate other content, or extra commentary.`;
      } else if (promptType === "image") {
        userPrompt = `Create an image prompt: ${prompt}. Describe visual elements, style, composition, colors, and subjects. Output ONLY the prompt text with no greetings, explanations, offers to generate other content, or extra commentary.`;
      } else {
        userPrompt = `Create a video prompt: ${prompt}. Outline content, scenes, transitions, and style. Output ONLY the prompt text with no greetings, explanations, offers to generate other content, or extra commentary.`;
      }

      const fetchResponse = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: getModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
          temperature: 0.4,
          seed: -1,
        }),
      });

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`API error ${fetchResponse.status}: ${errorText}`);
      }

      if (!fetchResponse.body) {
        throw new Error('No response body received');
      }

      const reader = fetchResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let hasReceivedContent = false;

      eventSourceRef.current = { close: () => reader.cancel() };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                hasReceivedContent = true;
                setResponse({ text: fullText, loading: true, error: null });
              }
            } catch {
              // non-JSON chunk — skip
            }
          }
        }

        setResponse({ text: fullText, loading: false, error: null });
      } catch (streamError) {
        if (!hasReceivedContent || !fullText.trim()) {
          setResponse({
            text: '',
            loading: false,
            error: streamError instanceof Error ? streamError.message : "Failed to generate content",
          });
          toast({ title: "Error", description: "Failed to generate content. Please try again.", variant: "destructive" });
        } else {
          setResponse({ text: fullText, loading: false, error: null });
        }
      } finally {
        eventSourceRef.current = null;
      }
    } catch (error) {
      setResponse({
        text: "",
        loading: false,
        error: error instanceof Error ? error.message : "Failed to generate content"
      });
      toast({ title: "Error", description: "Failed to generate content. Please try again.", variant: "destructive" });
    }
  };

  // Cleanup event source when component unmounts
  const handleCopyResponse = () => {
    if (response.text) {
      navigator.clipboard.writeText(response.text);
      toast({
        title: "Copied",
        description: "Response copied to clipboard"
      });
    }
  };

  const handleUsePrompt = () => {
    if (response.text) {
      onUsePrompt(response.text, promptType);
      toast({
        title: "Success",
        description: "AI response added as a new prompt"
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-50 w-auto sm:w-full sm:max-w-md">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "rgba(9,9,11,0.97)",
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
          border: "1px solid rgba(63,63,70,0.50)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <CollapsibleTrigger asChild>
          <ShinyButton
            hex="#22d3ee"
            className="w-full rounded-t-2xl rounded-b-none"
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span>AI Prompt Assistant</span>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </ShinyButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <label htmlFor="promptType" className="text-xs sm:text-sm font-medium text-muted-foreground">
              What type of prompt do you want to generate?
            </label>
            <RadioGroup
              value={promptType}
              onValueChange={(value) => setPromptType(value as "system" | "task" | "image" | "video")}
              className="flex flex-wrap gap-2 sm:space-x-4 sm:gap-0"
            >
              <div className="flex items-center space-x-1 sm:space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="text-xs sm:text-sm">System</Label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <RadioGroupItem value="task" id="task" />
                <Label htmlFor="task" className="text-xs sm:text-sm">Task</Label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <RadioGroupItem value="image" id="image" />
                <Label htmlFor="image" className="text-xs sm:text-sm">Image</Label>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="text-xs sm:text-sm">Video</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <label htmlFor="prompt" className="text-xs sm:text-sm font-medium text-muted-foreground">
              {promptType === "system"
                ? "Describe the AI assistant's role and personality"
                : promptType === "task"
                  ? "What kind of task prompt would you like to create?"
                  : promptType === "image"
                    ? "Describe the desired visual elements, style, composition, colors, and subjects"
                    : "Outline the content, scenes, transitions, and style guidelines"
              }
            </label>
            <Textarea
              id="prompt"
              placeholder={promptType === "system"
                ? "E.g., A friendly customer service assistant that helps with product inquiries"
                : promptType === "task"
                  ? "E.g., Create a prompt for writing a persuasive email"
                  : promptType === "image"
                    ? "E.g., Describe a sunset in a surreal style"
                    : "E.g., Outline a 30-second video clip"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[140px] sm:min-h-[160px] text-xs sm:text-sm"
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "var(--text-strong)",
                borderRadius: "12px",
              }}
            />
          </div>

          <ShinyButton
            onClick={handleGeneratePrompt}
            disabled={response.loading || !prompt.trim()}
            hex="#fbbf24"
            className="w-full"
          >
            {response.loading ? "Generating..." : "Generate Prompt"}
          </ShinyButton>

          {response.text && (
            <div className="space-y-2 sm:space-y-3">
              <div
                ref={responseRef}
                className="p-2 sm:p-3 rounded-xl max-h-[150px] sm:max-h-[200px] overflow-y-auto whitespace-pre-wrap text-xs sm:text-sm font-mono"
                style={{
                  background: "rgba(0,0,0,0.30)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--text-strong)",
                }}
              >
                {response.text}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm transition-all duration-200"
                  onClick={handleCopyResponse}
                  style={{
                    background: "rgba(34,211,238,0.10)",
                    border: "1px solid rgba(34,211,238,0.30)",
                    color: "#22d3ee",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.20)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(34,211,238,0.30)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.10)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Copy
                </Button>
                <ShinyButton
                  onClick={handleUsePrompt}
                  hex="#f43f8e"
                  size="sm"
                  className="flex-1"
                >
                  Use as Prompt
                </ShinyButton>
              </div>
            </div>
          )}

          {/* Only show the error message if there is an error AND no valid response text */}
          {response.error && !response.text && (
            <div className="p-3 bg-destructive/20 border border-destructive/40 rounded-md text-sm text-destructive">
              {response.error}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AIAssistant;
