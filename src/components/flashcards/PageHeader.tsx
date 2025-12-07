// src/components/flashcards/PageHeader.tsx

import * as React from "react";

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
}

/**
 * PageHeader displays the page title and optional action buttons
 */
export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <header className="mb-8" data-testid="page-header">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" data-testid="page-title">
          {title}
        </h1>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
      {description && (
        <p className="text-muted-foreground mt-2" data-testid="page-description">
          {description}
        </p>
      )}
    </header>
  );
}
