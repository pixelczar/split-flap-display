import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
        url: supabaseUrl ? '[PRESENT]' : '[MISSING]',
        key: supabaseAnonKey ? '[PRESENT]' : '[MISSING]'
    })
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 2,
        },
        timeout: 30000,
    },
})

// Add debug logging to test connection
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('Supabase connection error:', error)
    } else {
        console.log('Supabase connected successfully', {
            url: supabaseUrl ? '[PRESENT]' : '[MISSING]',
            key: supabaseAnonKey ? '[PRESENT]' : '[MISSING]'
        })
    }
})

export type Message = {
    id: number
    content: string
    created_at: string
} 