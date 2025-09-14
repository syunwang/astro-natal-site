// netlify/functions/geo.js
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { location } = JSON.parse(event.body || '{}');
    if(!location) return { statusCode: 400, body: JSON.stringify({ error:'Missing location' })};
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    const results = (data && data.results || []).map(it => ({
      location_name: it.name,
      latitude: it.latitude,
      longitude: it.longitude,
      timezone: it.timezone || null,
      country: it.country
    }));
    return { statusCode: 200, body: JSON.stringify({ results })};
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message })};
  }
}
