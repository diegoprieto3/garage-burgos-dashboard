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
      return { statusCode: callRes.status, body: JSON.stringify({ error: 'Failed to fetch call details' }) };
    }

    const callData = await callRes.json();
    const recordingUrl = callData?.artifact?.recordingUrl || callData?.recordingUrl;

    if (!recordingUrl) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No recording found for this call' }) };
    }

    const audioRes = await fetch(recordingUrl, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
    });

    if (!audioRes.ok) {
      return { statusCode: audioRes.status, body: JSON.stringify({ error: 'Failed to fetch recording' }) };
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = audioRes.headers.get('content-type') || 'audio/wav';

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
