import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://zlmoqiulzrqpnbxfeetp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__t2-g_ly7mOyzjOj6un36A_edOp9mU-';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
