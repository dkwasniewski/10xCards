import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: {
    id: string;
    email: string;
  } | null;
}

/**
 * Header component with navigation and user menu
 */
export function Header({ user }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are included in the request
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to logout");
      }

      // Parse the response to ensure it completed
      await response.json();

      // Clear any user-specific data from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("10xCards_lastSessionId");
      }

      // Wait a brief moment for cookies to be cleared, then redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to home page after successful logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-6">
          <a href={user ? "/generate" : "/"} className="flex items-center space-x-2">
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
              className="text-primary"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 15h0M12 15h0M17 15h0" />
            </svg>
            <span className="font-bold text-xl">10xCards</span>
          </a>

          {/* Navigation Links (only show when authenticated) */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <a href="/generate" className="text-sm font-medium transition-colors hover:text-primary">
                Generate
              </a>
              <a
                href="/flashcards"
                className="text-sm font-medium transition-colors hover:text-primary"
                data-testid="nav-my-flashcards"
              >
                My Flashcards
              </a>
            </nav>
          )}
        </div>

        {/* Right Side - Auth Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            // Authenticated User Menu
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <span className="text-sm font-medium">{user.email.charAt(0).toUpperCase()}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/generate" className="cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Generate
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/flashcards" className="cursor-pointer" data-testid="dropdown-my-flashcards">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                    </svg>
                    My Flashcards
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Unauthenticated Links
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <a href="/login">Sign in</a>
              </Button>
              <Button asChild>
                <a href="/register">Sign up</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
