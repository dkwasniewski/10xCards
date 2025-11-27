import type { SupabaseClient } from "../../db/supabase.client";
import type { LoginResponseDto, RegisterResponseDto } from "../../types";

/**
 * Authentication service for handling user authentication operations with Supabase Auth.
 * Provides methods for login, registration, logout, and password management.
 */
class AuthService {
  /**
   * Registers a new user with email and password.
   * Sends email confirmation link to user's email address.
   *
   * @param supabase - Supabase client instance
   * @param email - User's email address
   * @param password - User's password
   * @returns User data (id, email, created_at)
   * @throws Error if registration fails or email already exists
   */
  async register(supabase: SupabaseClient, email: string, password: string): Promise<RegisterResponseDto> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${import.meta.env.PUBLIC_SITE_URL}/verify-email`,
      },
    });

    if (error) {
      // Map Supabase error codes to user-friendly messages
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        throw new Error("An account with this email already exists");
      }
      throw error;
    }

    if (!data.user) {
      throw new Error("Failed to create user account");
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      created_at: data.user.created_at,
    };
  }

  /**
   * Authenticates a user with email and password.
   * Sets session cookies automatically via Supabase client.
   *
   * @param supabase - Supabase client instance
   * @param email - User's email address
   * @param password - User's password
   * @returns Access token and expiration time
   * @throws Error if login fails or credentials are invalid
   */
  async login(supabase: SupabaseClient, email: string, password: string): Promise<LoginResponseDto> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error codes to user-friendly messages
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password");
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Please confirm your email address before logging in");
      }
      throw error;
    }

    if (!data.session) {
      throw new Error("Failed to create session");
    }

    return {
      access_token: data.session.access_token,
      expires_in: data.session.expires_in,
    };
  }

  /**
   * Logs out the current user.
   * Clears session cookies automatically via Supabase client.
   *
   * @param supabase - Supabase client instance
   * @throws Error if logout fails (errors are logged but not thrown)
   */
  async logout(supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log error but don't throw - logout should always succeed client-side
      console.error("Logout error:", error);
    }
  }

  /**
   * Sends a password reset email to the user.
   * Always returns success to prevent email enumeration attacks.
   *
   * @param supabase - Supabase client instance
   * @param email - User's email address
   * @param redirectUrl - URL to redirect to after password reset
   */
  async requestPasswordReset(supabase: SupabaseClient, email: string, redirectUrl: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    // Don't throw error to prevent email enumeration
    // Just log it server-side
    if (error) {
      console.error("Password reset request error:", error);
    }
  }

  /**
   * Resets user password with a valid reset token.
   * Token is validated by Supabase automatically.
   *
   * @param supabase - Supabase client instance
   * @param newPassword - New password to set
   * @throws Error if token is invalid/expired or password update fails
   */
  async resetPassword(supabase: SupabaseClient, newPassword: string): Promise<void> {
    // The token is already validated by Supabase when the session was created
    // from the reset link, so we just update the password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes("same as the old password")) {
        throw new Error("New password must be different from your old password");
      }
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
