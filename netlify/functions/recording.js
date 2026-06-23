exports.handler = async function(event, context) {
  const callId = event.queryStringParameters && event.queryStringParameters.callId;
  if (!callId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'callId is required' }) };
  }
  const VAPI_API_KEY = 'e19f3aaf-e171-4e14-80c4-57c4139328e7';
  try {
    const callRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });
    if (!callRes.ok) {
      return { statusCode: callRes.status, body: JSON.stringify({ error: 'Failed to fetch call details', status: callRes.status }) };
    }
    const callData = await callRes.json();
    const recordingUrl = callData?.artifact?.recordingUrl || callData?.recordingUrl;
    if (!recordingUrl) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No recording URL found' }) };
    }
    // Try without auth first (S3 URLs don't need it)
    const audioRes = await fetch(recordingUrl);
    if (!audioRes.ok) {
      // Try with auth
      const audioRes2 = await fetch(recordingUrl, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      });
      if (!audioRes2.ok) {
        return { statusCode: audioRes2.status, body: JSON.stringify({ error: 'Failed to fetch recording', recordingUrl, status: audioRes2.status }) };
      }
      const arrayBuffer2 = await audioRes2.arrayBuffer();
      const base64_2 = Buffer.from(arrayBuffer2).toString('base64');
      const contentType2 = audioRes2.headers.get('content-type') || 'audio/wav';
      return {
        statusCode: 200,
        headers: { 'Content-Type': contentType2, 'Access-Control-Allow-Origin': '*' },
        body: base64_2,
        isBase64Encoded: true,
      };
    }
    const arrayBuffer = await audioRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = audioRes.headers.get('content-type') || 'audio/wav';
    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
