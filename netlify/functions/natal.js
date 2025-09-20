// Netlify Function: /natal
// POST /.netlify/functions/natal  Content-Type: application/json
// Body fields accepted (aliases supported):
// year, month, day, hour, minute,
// lat/latitude, lon/longitude, tz/timezone, language
const fetch = require("node-fetch");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-api-key",
};

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Missing JSON body" }),
      };
    }

    let body;
    try { body = JSON.parse(event.body); }
    catch {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    // 參數標準化
    const payload = {
      year: Number(body.year),
      month: Number(body.month),
      day: Number(body.day),
      hour: Number(body.hour),
      minute: Number(body.minute),
      latitude: body.latitude != null ? Number(body.latitude) : Number(body.lat),
      longitude: body.longitude != null ? Number(body.longitude) : Number(body.lon),
      timezone: body.timezone != null ? Number(body.timezone) : Number(body.tz),
      language: (body.language || "en").toLowerCase(),
    };

    // 必填檢查
    const missing = [];
    for (const k of ["year","month","day","hour","minute","latitude","longitude","timezone"]) {
      if (!Number.isFinite(payload[k])) missing.push(k);
    }
    if (missing.length) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Missing required fields", fields: missing }),
      };
    }

    // 呼叫上游
    const apiUrl = process.env.FREEASTRO_API_URL;   // e.g. https://json.freeastrologyapi.com/api/v1/western/natal-wheel-chart
    const apiKey = process.env.FREEASTRO_API_KEY;

    if (!apiUrl || !apiKey) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: "Server not configured: FREEASTRO_API_URL / FREEASTRO_API_KEY missing" }),
      };
    }

    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.text();
    let data; try { data = JSON.parse(raw); } catch { data = raw; }

    // 把上游 status 原樣帶回（方便你在前端與 PowerShell 看到真實錯誤）
    return { statusCode: r.status, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Natal function crashed", detail: String(err) }),
    };
  }
};
