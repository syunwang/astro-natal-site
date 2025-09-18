
// netlify/functions/natal.js
const DEFAULT_API_URL = process.env.FREEASTRO_API_URL
  || 'https://json.freeastrologyapi.com/api/v1/western/natal-wheel-chart';
const API_KEY = process.env.FREEASTRO_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing FREEASTRO_API_KEY' })
    };
  }

  let data = {};
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const body = {
    year: Number(data.year),
    month: Number(data.month),
    day: Number(data.day),
    hour: Number(data.hour),
    minute: Number(data.minute),
    latitude: Number(data.latitude ?? data.lat),
    longitude: Number(data.longitude ?? data.lon),
    timezone: Number(data.timezone ?? data.tz),
    language: data.language || 'en'
  };

  try {
    const res = await fetch(DEFAULT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Fetch failed', reason: String(err) })
    };
  }
};
