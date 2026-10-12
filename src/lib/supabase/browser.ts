import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../env'

let client: ReturnType<typeof createBrowserClient> | null = null

/** Browser client for the admin panel (uploads go straight to Storage under the admin's session). */
export function getSupabaseBrowser() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  return client
}
