// db/supabase/mockSupabase.ts

import { AuthChangeEvent, Session, type User } from "@supabase/supabase-js"

// Define the interface based on the parts of Supabase you use
interface MockAuth {
  getUser: () => Promise<{ data: { user: User | null }; error: null }>
  signIn: (params: any) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
}

interface MockSupabaseClient {
  auth: MockAuth
  // Add other properties/methods you use from Supabase
}

export const createMockClient = (): MockSupabaseClient => ({
  auth: {
    getUser: async () => ({
      data: { user: null }, // Mock user as not logged in
      error: null,
    }),
    signIn: async (params: any) => ({
      data: { user: { id: "mock-user-id", email: "mock@example.com" } },
      error: null,
    }),
    signOut: async () => ({ error: null }),
  },
  // Implement other mocked methods if needed
})
