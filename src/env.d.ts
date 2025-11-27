/// <reference types="astro/client" />

import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: Session | null;
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_API_URL: string;
  readonly SITE_URL: string;
  readonly PUBLIC_SITE_URL: string; // Public version of SITE_URL for client-side access
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "react";
declare module "react/jsx-runtime";
