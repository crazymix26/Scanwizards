import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://mybjttehecduzulururb.supabase.co';
const supabaseAnonKey = 
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Ymp0dGVoZWNkdXp1bHVydXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTEyMzEsImV4cCI6MjA2ODEyNzIzMX0.JxyU7I54qAWoQBillFtpm-GaMzAaDc3oPj9iZUQwd08';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})