// src/components/auth/AuthSuccess.tsx

import * as React from "react";
import { CheckCircle } from "lucide-react";

interface AuthSuccessProps {
  title: string;
  message: string;
  submessage?: string;
  email?: string;
  linkText?: string;
  linkHref?: string;
}

/**
 * Reusable success screen for auth flows
 * Replaces 30+ lines of duplicated success state rendering
 */
export function AuthSuccess({
  title,
  message,
  submessage,
  email,
  linkText = "Back to login",
  linkHref = "/login",
}: AuthSuccessProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">
          {message}
          {email && (
            <>
              {" "}
              <strong>{email}</strong>
            </>
          )}
        </p>
        {submessage && <p className="text-sm text-muted-foreground pt-4">{submessage}</p>}
      </div>

      <div className="text-center">
        <a href={linkHref} className="text-primary hover:underline font-medium">
          {linkText}
        </a>
      </div>
    </div>
  );
}
