import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

async function main() {
  console.log('🧹 Cleaning database...');

  const [p, mp, mr, r] = await Promise.all([
    supabase.from('predictions').delete().neq('player', '~'),
    supabase.from('match_picks').delete().neq('player', '~'),
    supabase.from('match_results').delete().gte('match_id', 1),
    supabase.from('results').upsert({ id: 1, data: {} }),
  ]);

  const errors = [p.error, mp.error, mr.error, r.error].filter(Boolean);
  if (errors.length) {
    for (const e of errors) console.error('❌', e?.message);
    process.exit(1);
  }

  console.log('✅ Database cleared. Ready for real play!');
}

main().catch(err => { console.error(err); process.exit(1); });
