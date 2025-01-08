// db/supabase/client.ts

import { createMockClient } from "./mockSupabase"

// Define a type that includes both real and mock clients
type Supabase = ReturnType<typeof createMockClient>

export const createClient = (): Supabase => {
  console.warn("Supabase keys not found. Using mock client.")
  return createMockClient()
}
