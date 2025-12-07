// src/components/auth/AuthLoading.tsx

import * as React from "react";
import { Loader2 } from "lucide-react";

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
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
