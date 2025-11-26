import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * ForgotPasswordForm handles password reset request
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string }>({});

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setErrors({});

    // Validate email
    const emailError = validateEmail(email);

    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement API call to /api/auth/forgot-password
      console.log("Password reset request:", { email });

      // Placeholder for actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // On success, show success message
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Success state
  if (success) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600 dark:text-green-500"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            If an account exists with <strong>{email}</strong>, you will receive password reset instructions.
          </p>
          <p className="text-sm text-muted-foreground pt-4">
            Check your inbox and follow the link to reset your password.
          </p>
        </div>

        <div className="text-center">
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Forgot password?</h1>
        <p className="text-muted-foreground">Enter your email to receive a password reset link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            placeholder="you@example.com"
            className={errors.email ? "border-destructive" : ""}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      {/* Back to Login Link */}
      <div className="text-center text-sm">
        <a href="/auth/login" className="text-primary hover:underline font-medium">
          Back to login
        </a>
      </div>
    </div>
  );
}


