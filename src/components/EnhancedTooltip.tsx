/**
 * Enhanced Tooltip Component
 * Provides helpful tooltips with keyboard shortcuts
 */
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface EnhancedTooltipProps {
  children: ReactNode;
  content: string;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
}

export function EnhancedTooltip({
  children,
  content,
  shortcut,
  side = "top",
  disabled = false,
}: EnhancedTooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="flex flex-col gap-1">
          <p>{content}</p>
          {shortcut && (
            <kbd className="px-2 py-0.5 text-xs bg-gray-800 text-white rounded border border-gray-600">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

