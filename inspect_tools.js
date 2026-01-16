async function listTools() {
  const url = 'https://haebojago.fly.dev/mcp/gabojago/messages';
  console.log(`Sending tools/list to ${url}...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      })
    });
    
    // MCP responses can be 200 OK or 202 Accepted.
    // If it returns result directly, great.
    // If it returns "Accepted", the result might come via SSE (which I am not listening to here).
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log('Body:', text);
    
  } catch (e) {
    console.error('Error:', e);
  }
}

listTools();
