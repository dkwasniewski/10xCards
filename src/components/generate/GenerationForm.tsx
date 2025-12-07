// src/components/generate/GenerationForm.tsx

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALLOWED_MODELS, DEFAULT_MODEL } from "@/lib/services/ai.service";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

interface GenerationFormProps {
  onSubmit: (inputText: string, model: string) => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * GenerationForm allows users to input text and select a model to generate flashcards
 */
export function GenerationForm({ onSubmit, isLoading = false }: GenerationFormProps) {
  const [inputText, setInputText] = React.useState("");
  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [errors, setErrors] = React.useState<{ inputText?: string; model?: string }>({});

  const charCount = inputText.length;
  const isUnderMin = charCount > 0 && charCount < MIN_CHARS;
  const isOverMax = charCount > MAX_CHARS;
  const hasValidLength = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  // Character count color logic
  const getCharCountColor = () => {
    if (charCount === 0) return "text-muted-foreground";
    if (isUnderMin) return "text-amber-600 dark:text-amber-500";
    if (isOverMax) return "text-destructive";
    return "text-green-600 dark:text-green-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate input text
    const newErrors: { inputText?: string; model?: string } = {};

    if (!inputText.trim()) {
      newErrors.inputText = "Please enter some text to generate flashcards from";
    } else if (inputText.length < MIN_CHARS) {
      newErrors.inputText = `Text must be at least ${MIN_CHARS} characters (currently ${charCount})`;
    } else if (inputText.length > MAX_CHARS) {
      newErrors.inputText = `Text must be at most ${MAX_CHARS} characters (currently ${charCount})`;
    }

    // Validate model
    if (!ALLOWED_MODELS.includes(model)) {
      newErrors.model = "Please select a valid model";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit the form
    await onSubmit(inputText, model);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Clear error when user starts typing
    if (errors.inputText) {
      setErrors((prev) => ({ ...prev, inputText: undefined }));
    }
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    // Clear error when user selects a model
    if (errors.model) {
      setErrors((prev) => ({ ...prev, model: undefined }));
    }
  };

  // Format model name for display
  const formatModelName = (modelId: string) => {
    const parts = modelId.split("/");
    if (parts.length === 2) {
      const [provider, modelName] = parts;
      return `${provider.charAt(0).toUpperCase() + provider.slice(1)} - ${modelName}`;
    }
    return modelId;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Text Input */}
      <div className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <Label htmlFor="input-text">Source Text</Label>
          <span className={`text-xs font-medium ${getCharCountColor()}`} data-testid="char-count">
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </span>
        </div>
        <Textarea
          id="input-text"
          value={inputText}
          onChange={handleTextChange}
          disabled={isLoading}
          placeholder={`Paste your text here (minimum ${MIN_CHARS.toLocaleString()} characters)...`}
          className={`min-h-[200px] resize-y ${errors.inputText ? "border-destructive" : ""}`}
          aria-invalid={!!errors.inputText}
          aria-describedby={errors.inputText ? "input-text-error" : undefined}
          data-testid="source-text-input"
        />
        {errors.inputText && (
          <p id="input-text-error" className="text-sm text-destructive">
            {errors.inputText}
          </p>
        )}
        {!errors.inputText && isUnderMin && (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {(MIN_CHARS - charCount).toLocaleString()} more characters needed
          </p>
        )}
        {!errors.inputText && hasValidLength && (
          <p className="text-sm text-green-600 dark:text-green-500" data-testid="ready-to-generate">
            Ready to generate flashcards!
          </p>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model-select">AI Model</Label>
        <Select value={model} onValueChange={handleModelChange} disabled={isLoading}>
          <SelectTrigger
            id="model-select"
            className={errors.model ? "border-destructive" : ""}
            aria-invalid={!!errors.model}
            aria-describedby={errors.model ? "model-error" : undefined}
            data-testid="model-select-trigger"
          >
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} data-testid="model-select-content">
            {ALLOWED_MODELS.map((modelId) => (
              <SelectItem key={modelId} value={modelId} data-testid={`model-option-${modelId}`}>
                {formatModelName(modelId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.model && (
          <p id="model-error" className="text-sm text-destructive">
            {errors.model}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Choose the AI model to generate your flashcards. Different models may produce varying results.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !hasValidLength}
        className="w-full"
        data-testid="generate-flashcards-button"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
            Generating flashcards...
          </>
        ) : (
          "Generate Flashcards"
        )}
      </Button>
    </form>
  );
}
