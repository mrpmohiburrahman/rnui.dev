// db/supabase/server.ts

import type { SupabaseClient } from "@supabase/supabase-js"

import type { createMockClient } from "./mockSupabase"

export const createServerClient = (): void => {
  // if (supabase.auth && supabase.auth.setAuth) {
  //   // Real Supabase client
  //   return supabase
  // } else {
  //   // Mock client
  //   return supabase
  // }
}
