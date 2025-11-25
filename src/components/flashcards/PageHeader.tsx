// src/components/flashcards/PageHeader.tsx

import * as React from "react";

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

/**
 * PageHeader displays the page title and optional action buttons
 */
export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  );
}
