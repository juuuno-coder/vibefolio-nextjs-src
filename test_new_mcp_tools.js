async function callTool(name, args) {
  const url = 'https://haebojago.fly.dev/mcp/gabojago/messages';
  console.log(`\n🧩 Invoking Tool: '${name}' with args: ${JSON.stringify(args)}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
            name: name,
            arguments: args
        }
      })
    });
    
    const data = await res.json();
    if (data.result && data.result.content) {
        console.log(`✅ Success! Response preview:`);
        const text = data.result.content[0].text;
        console.log(text.substring(0, 150) + "...");
    } else {
        console.log(`❌ Failed or empty.`);
        console.log(JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

async function runTests() {
    console.log("🔍 Testing newly detected AI capabilities...");
    
    // 1. AI Jobs
    await callTool('search_ai_jobs', { keyword: '프롬프트' });
    
    // 2. AI Trends
    await callTool('get_ai_trends', { keyword: 'Sora' });
    
    // 3. Recipes
    await callTool('search_ai_recipes', { style: '사이버펑크' });
    
    // 4. Tools
    await callTool('recommend_ai_tools', { purpose: '배경 제거' });
}

runTests();
