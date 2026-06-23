exports.handler = async function(event, context) {
  const VAPI_API_KEY = 'e19f3aaf-e171-4e14-80c4-57c4139328e7';
  const ASSISTANT_ID = 'e228da9c-4dec-4f3b-b8ea-f975aa0d7d5e';
  const SUPABASE_URL = 'https://haxozjahcnktbliephdx.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheG96amFoY25rdGJsaWVwaGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjgwMzIsImV4cCI6MjA5NzgwNDAzMn0.f5hw4q11wtPeTU6A21xaX9qJdCkFdMWZ1qCKOrwaeZE';

  try {
    // Fetch calls from Vapi
    const res = await fetch(`https://api.vapi.ai/call?limit=100&assistantId=${ASSISTANT_ID}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });
    if (!res.ok) throw new Error('Vapi fetch failed: ' + res.status);
    const data = await res.json();
    const calls = Array.isArray(data) ? data : (data.results || data.calls || []);

    // Upsert each call into Supabase
    for (const c of calls) {
      const dur = c.duration || c.durationSeconds || 0;
      const record = {
        id: c.id,
        assistant_id: c.assistantId || ASSISTANT_ID,
        caller_number: c.customer?.number || c.phoneNumber || null,
        caller_name: null,
        duration: Math.round(dur),
        started_at: c.startedAt || c.createdAt || null,
        ended_at: c.endedAt || null,
        recording_url: c.artifact?.recordingUrl || c.recordingUrl || null,
        summary: c.artifact?.summary || c.summary || null,
        end_reason: c.endedReason || c.status || null
      };

      await fetch(`${SUPABASE_URL}/rest/v1/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(record)
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, synced: calls.length })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
