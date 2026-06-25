exports.handler = async function(event, context) {
  const callId = event.queryStringParameters && event.queryStringParameters.callId;
  if (!callId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'callId is required' }) };
  }
  const VAPI_API_KEY = 'e19f3aaf-e171-4e14-80c4-57c4139328e7';
  try {
    const callRes = await fetch(`https://api.vapi.ai/call/${callId}/mono-recording`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });
    if (!callRes.ok) {
      // Fallback to artifact recordingUrl
      const callData = await fetch(`https://api.vapi.ai/call/${callId}`, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }).then(r => r.json());
      const recordingUrl = callData?.artifact?.recordingUrl || callData?.recordingUrl;
      if (!recordingUrl) {
        return { statusCode: 404, body: JSON.stringify({ error: 'No recording found' }) };
      }
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recordingUrl })
      };
    }
    const arrayBuffer = await callRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = callRes.headers.get('content-type') || 'audio/wav';
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
