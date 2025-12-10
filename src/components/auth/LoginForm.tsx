// src/components/auth/LoginForm.tsx

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingCards } from "@/components/ui/loading-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth.schema";

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string | null;
  initialMessage?: string | null;
}

/**
 * LoginForm handles user login interactions with comprehensive validation and error handling.
 * Refactored to use React Hook Form for better performance and cleaner code.
 * Follows auth-spec.md requirements for client-side validation and user feedback.
 */
export function LoginForm({ redirectTo = "/generate", initialError = null, initialMessage = null }: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(initialError);
  const [message, setMessage] = React.useState<string | null>(initialMessage);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      // Call login API endpoint
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Login failed. Please try again");
      }

      // Wait for cookies to be set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use the redirect URL from the response if available, otherwise use the prop
      const targetUrl = responseData.redirect || redirectTo;
      window.location.href = targetUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again");
      setIsLoading(false);
    }
  };

  // Clear errors when user starts typing
  const handleInputChange = () => {
    if (error) setError(null);
    if (message) setMessage(null);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Success Message */}
        {message && (
          <div
            className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md dark:text-green-400 dark:bg-green-950 dark:border-green-900"
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            placeholder="you@example.com"
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              onChange: handleInputChange,
            })}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <PasswordInput
          id="password"
          label="Password"
          showForgotLink={true}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isLoading}
          {...register("password", {
            onChange: handleInputChange,
          })}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full" aria-busy={isLoading}>
          {isLoading ? (
            <>
              <LoadingCards size={16} className="mr-2" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Register Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <a href="/register" className="text-primary hover:underline font-medium">
          Sign up
        </a>
      </div>
    </div>
  );
}
