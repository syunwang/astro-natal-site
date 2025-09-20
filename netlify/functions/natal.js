// netlify/functions/natal.js
const fetch = require("node-fetch"); // v2

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
      };
    }

    let payload = {};
    try {
      payload = event.body ? JSON.parse(event.body) : {};
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    // Accept both lat/lon and latitude/longitude, tz/timezone
    const body = {
      year: Number(payload.year),
      month: Number(payload.month),
      day: Number(payload.day),
      hour: Number(payload.hour),
      minute: Number(payload.minute),
      latitude: Number(payload.latitude ?? payload.lat),
      longitude: Number(payload.longitude ?? payload.lon),
      timezone: Number(payload.timezone ?? payload.tz),
      language: payload.language || "en",
    };

    const required = [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "latitude",
      "longitude",
      "timezone",
    ];
    const missing = required.filter(
      (k) => body[k] === undefined || Number.isNaN(body[k])
    );
    if (missing.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          fields: missing,
        }),
      };
    }

    const upstream =
      process.env.FREEASTRO_API_URL ||
      "https://json.freeastrologyapi.com/api/v1/western/natal-wheel-chart";
    const apiKey = process.env.FREEASTRO_API_KEY || "";

    const r = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    if (r.ok) {
      // Upstream may return JSON or SVG string; return both safely
      try {
        const json = JSON.parse(text);
        return { statusCode: 200, headers, body: JSON.stringify(json) };
      } catch {
        return { statusCode: 200, headers, body: JSON.stringify({ raw: text }) };
      }
    } else {
      let err;
      try {
        err = JSON.parse(text);
      } catch {
        err = { raw: text };
      }
      return { statusCode: r.status, headers, body: JSON.stringify(err) };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message || String(e) }),
    };
  }
};
