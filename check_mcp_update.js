async function listTools() {
  const url = 'https://haebojago.fly.dev/mcp/gabojago/messages';
  console.log(`Checking tools at ${url}...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
      })
    });
    
    // Status can be 200 or 202. 
    // If 202, it might not return body immediately or return empty.
    // Assuming simple JSONRPC over HTTP direct response for tools/list if possible.
    // If this fails to show new tools, I might need to rely on the fact user said it's updated.
    
    if (res.ok) {
        const text = await res.text();
        console.log('--- Tools List Response ---');
        console.log(text);
        try {
            const json = JSON.parse(text);
            if (json.result && json.result.tools) {
                console.log('\n--- Available Tools ---');
                json.result.tools.forEach(t => {
                    console.log(`- ${t.name}: ${t.description}`);
                });
            }
        } catch (e) {
            console.log('Response is not JSON.');
        }
    } else {
        console.log(`Failed with status: ${res.status}`);
    }
    
  } catch (e) {
    console.error('Error:', e);
  }
}

listTools();
