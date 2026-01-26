
const { createClient } = require('@supabase/supabase-js');

async function checkContests() {
  const supabase = createClient(
    'https://ddnebvjjkxigxbmkqvzr.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbmVidmpqa3hpZ3hibWtxdnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NjQwNSwiZXhwIjoyMDgwOTIyNDA1fQ.1rqoyoXAYoBf1FoeXx4_WfREyyPx-XXXVH_di9HJmk8'
  );

  const { data, error } = await supabase
    .from('recruit_items')
    .select('title, type, is_approved, created_at')
    .eq('type', 'contest')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} contests:`);
  data.slice(0, 10).forEach(item => {
    console.log(`- [${item.is_approved ? 'APPROVED' : 'PENDING'}] ${item.title} (${item.created_at})`);
  });
}

checkContests();
