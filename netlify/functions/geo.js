
// Netlify Function: /geo
export async function handler(event, context) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({error:"Method Not Allowed"}) };
  }

  try {
    const { location } = JSON.parse(event.body || "{}");
    if (!location || typeof location !== "string") {
      return { statusCode: 400, headers: cors, body: JSON.stringify({error:"Missing 'location'"}) };
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      return { statusCode: 502, headers: cors, body: JSON.stringify({error:"Geocoding upstream error", status: res.status}) };
    }
    const data = await res.json();
    if (!data || !data.results || !data.results.length) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({error:"No Location found with the given location name."}) };
    }
    const r = data.results[0];
    const out = {
      location_name: r.name,
      longitude: r.longitude,
      latitude: r.latitude,
      timezone_offset: null,
      timezone: r.timezone || undefined,
      complete_name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      country: r.country,
      administrative_zone_1: r.admin1 || undefined,
      administrative_zone_2: r.admin2 || undefined
    };
    return { statusCode: 200, headers: cors, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({error:e.message}) };
  }
}
