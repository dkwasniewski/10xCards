// src/components/auth/VerifyEmailContent.tsx

import * as React from "react";
import { AuthLoading } from "./AuthLoading";
import { AuthSuccess } from "./AuthSuccess";

interface VerifyEmailContentProps {
  sessionEstablished?: boolean;
}

/**
 * VerifyEmailContent handles email verification with PKCE code exchange.
 * Displays loading, success, or error states during verification.
 */
export function VerifyEmailContent({ sessionEstablished = false }: VerifyEmailContentProps) {
  const [isVerifying, setIsVerifying] = React.useState(true);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If session already established, redirect immediately
    if (sessionEstablished) {
      window.location.href = "/generate";
      return;
    }

    // Extract code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) {
      // No code in URL - show error
      setIsVerifying(false);
      setErrorMessage("Missing verification code. Please use the link from your email.");
      return;
    }

    // Exchange code for session
    fetch("/api/auth/exchange-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Success - show success message and redirect
          setIsVerifying(false);
          setIsSuccess(true);

          // Redirect to app after 2 seconds
          setTimeout(() => {
            window.location.href = "/generate";
          }, 2000);
        } else {
          // Error from API
          setIsVerifying(false);
          setErrorMessage(data.error || "Failed to verify email. Please try again.");
        }
      })
      .catch(() => {
        // Network or unexpected error
        setIsVerifying(false);
        setErrorMessage("An unexpected error occurred. Please try again.");
      });
  }, [sessionEstablished]);

  // Loading state
  if (isVerifying) {
    return <AuthLoading title="Verifying your email..." message="Please wait while we confirm your email address." />;
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthSuccess
        title="Email verified!"
        message="Your email has been successfully verified."
        submessage="Redirecting you to the app..."
        linkText="Go to app"
        linkHref="/generate"
      />
    );
  }

  // Error state
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-600 dark:text-red-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Verification failed</h1>
        <p className="text-muted-foreground text-lg">
          {errorMessage || "The verification link is invalid or has expired."}
        </p>
        <div className="pt-4">
          <a
            href="/register"
            className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to registration
          </a>
        </div>
      </div>
    </div>
  );
}
