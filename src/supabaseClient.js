
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://efrxlscllziyatnzyoan.supabase.co'
const supabaseKey = 'sb_publishable_-JHi_ZZYqia6vS-LV_tPuQ_pfeljGe3'

export const supabase = createClient(supabaseUrl, supabaseKey)
