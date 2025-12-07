// src/lib/hooks/usePasswordResetSession.ts

import * as React from "react";

interface UsePasswordResetSessionResult {
  isEstablishing: boolean;
  hasValidSession: boolean;
  error: string | null;
}

/**
 * Custom hook to handle password reset session establishment
 * Extracts complex token handling logic from ResetPasswordForm component
 * Supports both PKCE (modern) and hash token (legacy) flows
 */
export function usePasswordResetSession(
  sessionEstablished?: boolean,
  pageError?: string | null
): UsePasswordResetSessionResult {
  const [isEstablishing, setIsEstablishing] = React.useState(false);
  const [hasValidSession, setHasValidSession] = React.useState(sessionEstablished || false);
  const [error, setError] = React.useState<string | null>(pageError || null);

  React.useEffect(() => {
    // Set page error if provided
    if (pageError) {
      setError(pageError);
      return;
    }

    // If session already established, we're good
    if (sessionEstablished) {
      setHasValidSession(true);
      return;
    }

    // Try to get PKCE code from query params (modern flow)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    // Try to get tokens from URL hash (legacy flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const hashType = hashParams.get("type");

    // PKCE flow
    if (code) {
      setIsEstablishing(true);

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
            setHasValidSession(true);
            // Clean up URL
            window.history.replaceState(null, "", window.location.pathname);
          } else {
            setError(data.error || "Failed to verify reset link");
          }
        })
        .catch(() => {
          setError("Failed to verify reset link");
        })
        .finally(() => {
          setIsEstablishing(false);
        });
      return;
    }

    // Legacy hash flow
    if (accessToken && hashType === "recovery") {
      setIsEstablishing(true);

      fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHasValidSession(true);
            // Clean up URL hash
            window.history.replaceState(null, "", window.location.pathname);
          } else {
            setError(data.error || "Failed to verify reset link");
          }
        })
        .catch(() => {
          setError("Failed to verify reset link");
        })
        .finally(() => {
          setIsEstablishing(false);
        });
      return;
    }

    // No valid token found
    if (!code && !accessToken) {
      setError("Please use the password reset link from your email");
    }
  }, [sessionEstablished, pageError]);

  return {
    isEstablishing,
    hasValidSession,
    error,
  };
}
