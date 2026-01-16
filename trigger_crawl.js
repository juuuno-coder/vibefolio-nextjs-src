// Trying port 3300 based on running processes

async function trigger(keyword) {
  console.log(`Triggering crawl for: ${keyword}`);
  try {
    const res = await fetch('http://localhost:3300/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });
    const data = await res.json();
    console.log(`Result for ${keyword}:`, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Failed to crawl ${keyword}:`, e.message);
    if(e.cause) console.error(e.cause);
  }
}

async function run() {
  await trigger("카카오 MCP");
  await trigger("오설록 AI");
  await trigger("Cursor");
}

run();
