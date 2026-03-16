
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = () => {
    const url = localStorage.getItem('hope_os_supabase_url') || import.meta.env.VITE_SUPABASE_URL;
    const key = localStorage.getItem('hope_os_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url && key) {
        return createClient(url, key);
    }
    return null;
};
