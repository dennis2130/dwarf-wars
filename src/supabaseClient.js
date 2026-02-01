/**
 * supabaseClient.js
 *
 * Sets up and exports the Supabase client for Dwarf Wars.
 *
 * Usage:
 * - Used in App.jsx for authentication (Google login/logout)
 * - Used for database operations: saving/loading characters, leaderboard scores
 *
 * Exports:
 * - supabase: Configured Supabase client instance
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.
 */


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)


