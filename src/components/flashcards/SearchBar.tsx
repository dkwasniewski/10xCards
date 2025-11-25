// src/components/flashcards/SearchBar.tsx

import * as React from "react";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
}

/**
 * SearchBar provides a debounced search input for filtering flashcards
 */
export function SearchBar({ value, onChange, debounceMs = 300, placeholder = "Search flashcards..." }: SearchBarProps) {
  const [localValue, setLocalValue] = React.useState(value);

  // Sync local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced callback to update parent
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange(value);
  }, debounceMs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  const characterCount = localValue.length;
  const showWarning = characterCount >= 90;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          maxLength={100}
          className="pl-10 pr-10"
          aria-label="Search flashcards"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          {characterCount}/100 characters (search is limited to 100 characters)
        </p>
      )}
    </div>
  );
}
