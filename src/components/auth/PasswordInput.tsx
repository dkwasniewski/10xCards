// src/components/auth/PasswordInput.tsx

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string;
  showForgotLink?: boolean;
  "data-testid"?: string;
}

/**
 * Reusable password input with visibility toggle
 * Replaces 50+ lines of inline SVG with Lucide icons
 * Compatible with React Hook Form's register()
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      label,
      error,
      disabled = false,
      placeholder = "Enter your password",
      autoComplete = "current-password",
      showForgotLink = false,
      "data-testid": dataTestId,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <>
        {label && (
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor={id}>{label}</Label>
            {showForgotLink && (
              <a href="/forgot-password" className="text-sm text-primary hover:underline" tabIndex={-1}>
                Forgot password?
              </a>
            )}
          </div>
        )}
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            name={id}
            type={showPassword ? "text" : "password"}
            autoComplete={autoComplete}
            disabled={disabled}
            placeholder={placeholder}
            className={error ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            data-testid={dataTestId}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive mt-2" role="alert">
            {error}
          </p>
        )}
      </>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
