import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingCardsProps {
  className?: string;
  size?: number;
  "data-testid"?: string;
}

/**
 * Animated loading indicator using the 10xCards logo design
 * Cards gently rotate to create a loading animation effect
 */
export function LoadingCards({ className, size = 32, "data-testid": dataTestId }: LoadingCardsProps) {
  return (
    <div className={cn("inline-block", className)} data-testid={dataTestId}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className="text-primary"
      >
        {/* Back card - animated rotation */}
        <rect
          x="5"
          y="11"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.25"
          className="animate-loading-card-back"
        />
        {/* Middle card - animated rotation */}
        <rect
          x="5"
          y="11"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.5"
          className="animate-loading-card-middle"
        />
        {/* Front card - subtle pulse */}
        <rect
          x="5"
          y="11"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-loading-card-front"
        />
      </svg>
    </div>
  );
}
