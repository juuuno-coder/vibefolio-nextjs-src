
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env
const envPath = path.resolve(__dirname, '../../.env.local');
let SUPABASE_URL = '';
let SERVICE_KEY = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            if (key === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = val;
            if (key === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_KEY = val;
        }
    });
} catch (e) {
    console.error('Failed to read .env.local');
    process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    // 1. Get API Key
    const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('is_active', true)
        .limit(1)
        .single();
        
    let apiKey = '';
    
    if (keyError || !keyData) {
        console.log('No API Key found. Checking for users...');
        const { data: userData } = await supabase.from('profiles').select('id').limit(1).single();
        if (!userData) {
            console.error('No users found in DB. Cannot create key.');
            return;
        }
        
        apiKey = 'vf_test_' + Math.random().toString(36).substring(7);
        await supabase.from('api_keys').insert({
            user_id: userData.id,
            api_key: apiKey,
            key_name: 'Test Key'
        });
        console.log('Created Temp Key:', apiKey);
    } else {
        apiKey = keyData.api_key;
        console.log('Found API Key:', apiKey.substring(0, 5) + '...');
    }

    // 2. POST
    console.log('>>> Testing POST...');
    const postPayload = {
        title: "[Test] Lifecycle Project",
        content_text: "Initial content",
        visibility: "private"
    };
    
    const postRes = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(postPayload)
    });
    
    if (!postRes.ok) {
        console.error('POST Failed:', postRes.status, await postRes.text());
        return;
    }
    
    const postJson = await postRes.json();
    // API logic returns { project: data }
    const project = postJson.project || postJson.data;
    const projectId = project?.project_id;
    console.log('Created Project ID:', projectId);
    
    if (!projectId) {
        console.error('No project ID returned', postJson);
        return;
    }

    // 3. PUT
    console.log('>>> Testing PUT...');
    const putPayload = {
        title: "[Test] Updated Title via PUT",
        description: "Updated description",
        custom_data: { "test_merge": true, "assets": ["test.png"] }
    };
    
    const putRes = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(putPayload)
    });
    
    if (!putRes.ok) {
        console.error('PUT Failed:', putRes.status, await putRes.text());
    } else {
        const putJson = await putRes.json();
        console.log('PUT Success!', JSON.stringify(putJson, null, 2));
    }
}

run();
