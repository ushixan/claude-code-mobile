import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase config:', { 
  url: supabaseUrl, 
  keyLength: supabaseKey?.length 
})

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'present' : 'missing')
}

// Create client even if credentials are missing to avoid import errors
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null as any

// Export types
export type UserWorkspace = {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export type UserFile = {
  id: string
  user_id: string
  workspace_id: string
  path: string
  content: string
  is_directory: boolean
  created_at: string
  updated_at: string
}