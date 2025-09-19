
// netlify/functions/natal.js
const UPSTREAM_DEFAULT =
  "https://json.freeastrologyapi.com/api/v1/western/natal-wheel-chart";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

function safeParse(body) {
  try { return JSON.parse(body || "{}"); } catch { return {}; }
}
function num(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v); return Number.isFinite(n) ? n : undefined;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  const upstreamUrl =
    process.env.FREEASTRO_API_URL?.trim() || UPSTREAM_DEFAULT;
  const apiKey = process.env.FREEASTRO_API_KEY || "";
  const input = safeParse(event.body);
  const payload = {
    year: num(input.year), month: num(input.month), day: num(input.day),
    hour: num(input.hour), minute: num(input.minute),
    latitude: num(input.lat) ?? num(input.latitude),
    longitude: num(input.lon) ?? num(input.longitude),
    timezone: num(input.tz) ?? num(input.timezone),
    language: (input.language || "en").toString().trim(),
  };
  const missing = Object.entries({
    year: payload.year, month: payload.month, day: payload.day,
    hour: payload.hour, minute: payload.minute,
    latitude: payload.latitude, longitude: payload.longitude,
    timezone: payload.timezone,
  }).filter(([, v]) => v === undefined).map(([k]) => k);
  if (missing.length) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing required fields", fields: missing }),
    };
  }

  try {
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return {
      statusCode: res.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: res.ok, upstreamStatus: res.status, response: data }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "fetch failed", reason: String(err) }),
    };
  }
};
