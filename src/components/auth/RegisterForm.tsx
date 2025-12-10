// src/components/auth/RegisterForm.tsx

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingCards } from "@/components/ui/loading-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { AuthSuccess } from "./AuthSuccess";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth.schema";

/**
 * RegisterForm handles user registration interactions
 * Refactored to use React Hook Form for better performance and cleaner code
 */
export function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      // Call registration API endpoint
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Registration failed. Please try again");
      }

      setRegisteredEmail(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <AuthSuccess
        title="Check your email"
        message="We've sent a confirmation link to"
        email={registeredEmail}
        submessage="Click the link in the email to confirm your account and complete registration."
        linkText="Go to login"
        linkHref="/login"
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">Enter your details to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Error Alert */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            disabled={isLoading}
            placeholder="you@example.com"
            className={errors.email ? "border-destructive" : ""}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password?.message}
            disabled={isLoading}
            {...register("password")}
          />
          {!errors.password && password && <PasswordStrengthIndicator password={password} />}
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
              <LoadingCards size={16} className="mr-2" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <a href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </a>
      </div>
    </div>
  );
}
