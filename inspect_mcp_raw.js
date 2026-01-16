const https = require('https');
const { URL } = require('url');

const MCP_URL = 'https://haebojago.fly.dev/mcp/gabojago/sse';

function connectAndListTools() {
  console.log(`Connecting to ${MCP_URL}...`);
  
  const options = {
    hostname: 'haebojago.fly.dev',
    path: '/mcp/gabojago/sse',
    method: 'GET',
    headers: {
        'Accept': 'text/event-stream'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      const text = chunk.toString();
      console.log('--- Chunk ---');
      console.log(text);
       
      // Just wait a bit and exit, we just need the output logs to see the endpoint
      setTimeout(() => process.exit(0), 5000); 
    });

    res.on('end', () => console.log('Stream ended'));
  });
  
  req.on('error', (e) => console.error('Error:', e));
  req.end();
}

connectAndListTools();
