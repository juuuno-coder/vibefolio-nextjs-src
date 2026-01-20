
const http = require('http');

const data = JSON.stringify({
  keyword: 'AI 에이전트'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/crawl',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  console.log(`STATUS: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.log('Hint: Make sure "npm run dev" is running on port 3000.');
});

req.write(data);
req.end();
