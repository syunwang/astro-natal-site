// netlify/functions/natal.js
// Node 18+ on Netlify has global fetch.

const UPSTREAM_URL_FALLBACK =
  "https://json.freeastrologyapi.com/api/v1/western/natal-wheel-chart"; // 新的 json 域名
const TIMEOUT_MS = 45000;

exports.handler = async (event) => {
  // 仅允许 POST
  if (event.httpMethod !== "POST") {
    return jsonResp(405, { error: "Method Not Allowed. Use POST." });
  }

  // 解析请求体
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return jsonResp(400, { error: "Invalid JSON body" });
  }

  // 兼容别名：lat/lon/tz -> latitude/longitude/timezone
  const payload = {
    year: num(body.year),
    month: num(body.month),
    day: num(body.day),
    hour: num(body.hour),
    minute: num(body.minute),
    latitude: num(body.latitude ?? body.lat),
    longitude: num(body.longitude ?? body.lon),
    timezone: num(body.timezone ?? body.tz),
    language: (body.language || "en").toString()
  };

  // 校验必填
  const missing = Object.entries(payload)
    .filter(([k, v]) =>
      ["year", "month", "day", "hour", "minute", "latitude", "longitude", "timezone"].includes(k) &&
      (v === null || Number.isNaN(v))
    )
    .map(([k]) => k);

  if (missing.length) {
    return jsonResp(400, { error: "Missing required fields", fields: missing });
  }

  // 组装上游请求
  const upstreamUrl = process.env.FREEASTRO_API_URL || UPSTREAM_URL_FALLBACK;
  const apiKey = process.env.FREEASTRO_API_KEY;
  if (!apiKey) {
    return jsonResp(500, { error: "Server configuration missing FREEASTRO_API_KEY." });
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(t);

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // 透传上游状态码（200/4xx/5xx）
    return {
      statusCode: res.status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    clearTimeout(t);
    // 超时或网络错误
    return jsonResp(504, { error: "Upstream request failed", reason: String(err && err.name === "AbortError" ? "timeout" : err) });
  }
};

// 小工具
function jsonResp(status, obj) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(obj)
  };
}
function num(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
