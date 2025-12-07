// src/components/auth/ResetPasswordForm.tsx

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { AuthLoading } from "./AuthLoading";
import { AuthSuccess } from "./AuthSuccess";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/auth.schema";
import { usePasswordResetSession } from "@/lib/hooks/usePasswordResetSession";

interface ResetPasswordFormProps {
  sessionEstablished?: boolean;
  pageError?: string | null;
}

/**
 * ResetPasswordForm handles new password submission.
 * Refactored to use React Hook Form and custom hooks for session management.
 */
export function ResetPasswordForm({ sessionEstablished = false, pageError = null }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Use custom hook to handle session establishment
  const {
    isEstablishing,
    hasValidSession,
    error: sessionError,
  } = usePasswordResetSession(sessionEstablished, pageError);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const newPassword = watch("newPassword");

  // Set error from session hook
  React.useEffect(() => {
    if (sessionError) {
      setError(sessionError);
    }
  }, [sessionError]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);

    // Check if session is established
    if (!hasValidSession) {
      setError("Please use the password reset link from your email");
      return;
    }

    setIsLoading(true);

    try {
      // Call reset password API endpoint
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password: data.newPassword,
        }),
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Password reset failed. Please try again");
      }

      // Clear token from sessionStorage
      sessionStorage.removeItem("reset_token");

      // On success, show success message
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login?message=Password reset successful. Please log in with your new password.";
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while establishing session
  if (isEstablishing) {
    return (
      <AuthLoading title="Verifying reset link..." message="Please wait while we verify your password reset link." />
    );
  }

  // Success state
  if (success) {
    return (
      <AuthSuccess
        title="Password reset successful"
        message="Your password has been successfully reset."
        submessage="Redirecting to login page..."
        linkText="Go to login"
        linkHref="/login"
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Error Alert */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <p>{error}</p>
            {error.includes("link") && (
              <p className="mt-2">
                <a href="/forgot-password" className="underline hover:no-underline">
                  Request a new password reset link
                </a>
              </p>
            )}
          </div>
        )}

        {/* New Password Field */}
        <div className="space-y-2">
          <PasswordInput
            id="newPassword"
            label="New Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            disabled={isLoading}
            {...register("newPassword")}
          />
          {!errors.newPassword && newPassword && <PasswordStrengthIndicator password={newPassword} />}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            {...register("confirmPassword")}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </div>
  );
}
