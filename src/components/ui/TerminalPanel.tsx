import { useState, useEffect, useRef, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { X, Terminal, Loader2 } from "lucide-react";

interface TerminalLine {
  line: string;
  isError: boolean;
}

interface TerminalResult {
  success: boolean;
  exitCode: number;
}

interface TerminalPanelProps {
  program: string;
  args: string[];
  useSudo?: boolean;
  onComplete?: (success: boolean) => void;
  onClose: () => void;
}

export default function TerminalPanel({ program, args, useSudo = false, onComplete, onClose }: TerminalPanelProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
  }, []);

  useEffect(() => {
    setLines([]);
    setIsRunning(true);

    let mounted = true;

    const start = async () => {
      try {
        const unlisten = await listen<TerminalLine>("terminal_output", (event) => {
          if (mounted) {
            setLines((prev) => [...prev, event.payload]);
          }
        });
        unlistenRef.current = unlisten;

        const result = await invoke<TerminalResult>("run_command_live", {
          program,
          args,
          useSudo,
        });

        if (mounted) {
          setIsRunning(false);
          onComplete?.(result.success);
        }
      } catch (error) {
        if (mounted) {
          setLines((prev) => [
            ...prev,
            { line: `Error: ${error}`, isError: true },
          ]);
          setIsRunning(false);
        }
      }
    };

    start();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [program, args, useSudo, onComplete, cleanup]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-background rounded-xl border border-border w-[800px] max-w-[90vw] h-[500px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text">Terminal</span>
            {isRunning && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                Running...
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
            disabled={isRunning}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap break-words ${
                line.isError ? "text-danger" : "text-text-secondary"
              }`}
            >
              {line.line}
            </div>
          ))}
          {isRunning && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
