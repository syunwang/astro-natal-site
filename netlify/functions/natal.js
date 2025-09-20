// netlify/functions/natal.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // 必填字段校验
    const required = ["year", "month", "day", "hour", "minute", "lat", "lon", "tz"];
    const missing = required.filter((k) => body[k] === undefined || body[k] === null);
    if (missing.length) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Missing required fields", fields: missing }),
      };
    }

    const base = process.env.FREEASTRO_API_URL; // 例如 https://json.freeastrologyapi.com/v1/natal
    const apiKey = process.env.FREEASTRO_API_KEY;

    if (!base || !apiKey) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({
          error: "Server misconfigured",
          hint: "FREEASTRO_API_URL or FREEASTRO_API_KEY is missing",
        }),
      };
    }

    const headers = {
      "Content-Type": "application/json",
      // 两种都带上，兼容不同后端约定
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    };

    // ✅ Node18+ 自带 fetch
    const res = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        year: body.year,
        month: body.month,
        day: body.day,
        hour: body.hour,
        minute: body.minute,
        latitude: body.lat,   // 注意：如果上游期望 lat/lon 改这里
        longitude: body.lon,
        timezone: body.tz,
        language: body.language || "en",
      }),
    });

    const rawText = await res.text();
    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      json = { raw: rawText };
    }

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: CORS,
        body: JSON.stringify({ error: "Upstream error", body: json }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify(json),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Natal function error", message: String(err) }),
    };
  }
};
