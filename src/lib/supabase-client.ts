// TODO (Phase 4 — Supabase wiring):
// 1. Run `npm install @supabase/supabase-js`.
// 2. Create a Supabase project and copy the URL + anon key into .env.local
//    (see .env.example).
// 3. Run the SQL in /supabase/schema.sql against that project to create
//    tables, RLS policies, and storage buckets.
// 4. Uncomment the real client below and remove the placeholder.
// 5. Replace the mock-data-backed hooks in src/lib/mock-data.ts usage
//    throughout src/pages/client and src/pages/admin with real queries
//    against these tables.

// import { createClient } from "@supabase/supabase-js";
//
// export const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// );

export const supabase = {
  // Placeholder so the app builds before Supabase is wired up.
  // Replace this whole module per the TODO above.
  isConfigured: Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ),
};
