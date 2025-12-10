// src/components/auth/AuthLoading.tsx

import * as React from "react";
import { LoadingCards } from "@/components/ui/loading-cards";

interface AuthLoadingProps {
  title: string;
  message: string;
}

/**
 * Reusable loading screen for auth flows
 */
export function AuthLoading({ title, message }: AuthLoadingProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
          <LoadingCards size={48} />
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
