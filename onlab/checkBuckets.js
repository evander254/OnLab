
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://efrxlscllziyatnzyoan.supabase.co'
const supabaseKey = 'sb_publishable_-JHi_ZZYqia6vS-LV_tPuQ_pfeljGe3'
const supabase = createClient(supabaseUrl, supabaseKey)

async function listBuckets() {
    const { data, error } = await supabase
        .storage
        .listBuckets()

    if (error) {
        console.error('Error listing buckets:', error)
    } else {
        console.log('Buckets:', data)
    }
}

listBuckets()
