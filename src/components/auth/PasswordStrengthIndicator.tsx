import * as React from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = "weak" | "medium" | "strong";

interface StrengthConfig {
  label: string;
  color: string;
  bgColor: string;
  width: string;
}

const strengthConfigs: Record<StrengthLevel, StrengthConfig> = {
  weak: {
    label: "Weak",
    color: "text-destructive",
    bgColor: "bg-destructive",
    width: "w-1/3",
  },
  medium: {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-500",
    bgColor: "bg-amber-600 dark:bg-amber-500",
    width: "w-2/3",
  },
  strong: {
    label: "Strong",
    color: "text-green-600 dark:text-green-500",
    bgColor: "bg-green-600 dark:bg-green-500",
    width: "w-full",
  },
};

/**
 * PasswordStrengthIndicator provides visual feedback on password strength
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = (password: string): StrengthLevel | null => {
    if (!password || password.length === 0) return null;
    if (password.length < 8) return "weak";

    const criteria = {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    };

    const metCriteria = Object.values(criteria).filter(Boolean).length;

    if (metCriteria >= 4) return "strong";
    if (metCriteria >= 2) return "medium";
    return "weak";
  };

  const strength = getPasswordStrength(password);

  if (!strength) return null;

  const config = strengthConfigs[strength];

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${config.bgColor} ${config.width} transition-all duration-300`} />
      </div>

      {/* Label */}
      <p className={`text-sm font-medium ${config.color}`}>Password strength: {config.label}</p>

      {/* Criteria Hints */}
      {strength !== "strong" && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Password should contain:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {!/[A-Z]/.test(password) && <li>At least one uppercase letter</li>}
            {!/[a-z]/.test(password) && <li>At least one lowercase letter</li>}
            {!/[0-9]/.test(password) && <li>At least one number</li>}
            {!/[!@#$%^&*]/.test(password) && <li>At least one special character (!@#$%^&*)</li>}
            {password.length < 8 && <li>At least 8 characters</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

