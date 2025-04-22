import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
})

// Parse the environment variables
// If any required variables are missing, this will throw an error
// Process is a built-in node.js global
const parsedEnv = envSchema.safeParse(process.env)

// Throw a helpful error if the environment variables are invalid
if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format())
  throw new Error('Invalid environment variables')
}

// Export the parsed environment variables with renamed keys for consistency
export const env = {
  OPENAI_API_KEY: parsedEnv.data.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: parsedEnv.data.ANTHROPIC_API_KEY,
  SUPABASE_URL: parsedEnv.data.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: parsedEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: parsedEnv.data.SUPABASE_SERVICE_KEY,
  ELEVENLABS_API_KEY: parsedEnv.data.ELEVENLABS_API_KEY,
}

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables loaded:')
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 
    `Set (length: ${process.env.OPENAI_API_KEY.length}, prefix: ${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : 
    'Missing')
  console.log('OPENAI_API_KEY format check:', process.env.OPENAI_API_KEY ? 
    (process.env.OPENAI_API_KEY.includes('\n') ? 'Contains line breaks ❌' : 'No line breaks ✅') : 
    'Key not available')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing')
  console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'Set' : 'Missing')
} 