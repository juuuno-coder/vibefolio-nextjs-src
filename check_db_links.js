
const { createClient } = require('@supabase/supabase-js');

async function checkContestLinks() {
  const supabase = createClient(
    'https://ddnebvjjkxigxbmkqvzr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbmVidmpqa3hpZ3hibWtxdnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NjQwNSwiZXhwIjoyMDgwOTIyNDA1fQ.1rqoyoXAYoBf1FoeXx4_WfREyyPx-XXXVH_di9HJmk8'
  );

  const { data, error } = await supabase
    .from('recruit_items')
    .select('title, link, source_link')
    .eq('type', 'contest')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkContestLinks();
