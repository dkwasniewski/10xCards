import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

/**
 * Custom render function that wraps components with common providers
 * Extend this as needed with ThemeProvider, Router, etc.
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // Add any global providers here (e.g., ThemeProvider, QueryClientProvider)
  // const Wrapper = ({ children }: { children: React.ReactNode }) => {
  //   return <ThemeProvider>{children}</ThemeProvider>;
  // };

  return render(ui, { ...options });
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
export { renderWithProviders as render };
