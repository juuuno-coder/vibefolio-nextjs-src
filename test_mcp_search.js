async function searchActivities(keyword) {
  const url = 'https://haebojago.fly.dev/mcp/gabojago/messages';
  console.log(`\nCalling MCP tool 'search_activities' with keyword '${keyword}'...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "search_activities",
          arguments: { keyword: keyword }
        }
      })
    });
    
    // console.log(`Status: ${res.status}`);
    const data = await res.json();
    
    if (data.error) {
        console.error('MCP returned error:', JSON.stringify(data.error, null, 2));
        return;
    }
    
    if (data.result && data.result.content && data.result.content[0]) {
        const text = data.result.content[0].text;
        
        try {
            const parsed = JSON.parse(text);
            console.log(`✅ Success! Parsed ${parsed.length} items.`);
            parsed.slice(0, 3).forEach((item, idx) => {
                console.log(`   [${idx+1}] ${item.title || item.name}`);
            });
        } catch (e) {
            console.log(`⚠️  Returned text message (not JSON): "${text}"`);
        }
    } else {
        console.log('No result content found');
    }
    
  } catch (e) {
    console.error('Network Error:', e);
  }
}

async function run() {
    await searchActivities("카카오 mcp 공모전");
    await searchActivities("AI"); // Try a broader keyword to verify JSON format
}

run();
