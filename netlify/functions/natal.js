
/**
 * Netlify Function: natal
 * Purpose: Proxy request to FreeAstrologyAPI - Western Natal Wheel Chart
 * 
 * Env Vars required in Netlify (Site configuration → Environment variables):
 *  - FREEASTRO_API_KEY   : Your FreeAstrologyAPI key (required)
 *  - FREEASTRO_API_URL   : Optional. Defaults to 'https://json.freeastrologyapi.com/western/natal-wheel-chart'
 * 
 * Method: POST
 * Body (JSON):
 *  {
 *    "year": 1958,
 *    "month": 1,
 *    "day": 7,
 *    "hour": 8,
 *    "minute": 50,
 *    "latitude": 22.99083,
 *    "longitude": 120.21333,
 *    "timezone": 8,
 *    "language": "en"   // or "zh-Hans" / "zh-Hant"
 *  }
 */

const DEFAULT_URL = "https://json.freeastrologyapi.com/western/natal-wheel-chart";

// simple json responder
const jsonResponse = (status, data, extraHeaders = {}) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...extraHeaders,
  },
  body: JSON.stringify(data),
});

// handle preflight
const handleOptions = () => jsonResponse(204, {});

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return handleOptions();
    }
    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { error: "Method Not Allowed. Use POST." });
    }

    const apiKey = process.env.FREEASTRO_API_KEY;
    const upstreamUrl = process.env.FREEASTRO_API_URL || DEFAULT_URL;

    if (!apiKey) {
      return jsonResponse(500, { error: "Missing FREEASTRO_API_KEY in environment." });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch (e) {
      return jsonResponse(400, { error: "Invalid JSON body." });
    }

    // Validate required fields
    const required = ["year", "month", "day", "hour", "minute", "latitude", "longitude", "timezone"];
    const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === "");
    if (missing.length) {
      return jsonResponse(400, {
        error: "Missing required fields",
        fields: missing,
      });
    }

    // Default language
    if (!payload.language) payload.language = "en";

    // Abort/timeout after 45s
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);

    // Do request
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).catch((err) => {
      // Normalize abort/timeouts etc
      if (err && err.name === "AbortError") {
        return { ok: false, status: 504, statusText: "Gateway Timeout", _timeout: true, _err: String(err) };
      }
      return { ok: false, status: 502, statusText: "Bad Gateway", _err: String(err) };
    });
    clearTimeout(timer);

    // If fetch failed early (our synthetic object above)
    if (!res || res._timeout || res._err) {
      return jsonResponse(res && res.status ? res.status : 502, {
        error: "Upstream request failed",
        reason: res && (res._timeout ? "timeout" : res._err),
        upstreamUrl,
      });
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // Pipe upstream status & body back to client
    return jsonResponse(res.status, data);
  } catch (err) {
    return jsonResponse(500, {
      error: "Internal error in Netlify function",
      detail: String(err && err.stack ? err.stack : err),
    });
  }
};
