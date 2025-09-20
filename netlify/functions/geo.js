// netlify/functions/geo.js
const fetch = require("node-fetch"); // v2

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers };
    }
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed. Use GET." }),
      };
    }

    const place =
      (event.queryStringParameters && event.queryStringParameters.place) || "";
    if (!place) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing query param "place"' }),
      };
    }

    const upstream =
      process.env.FREEASTRO_GEO_URL || "https://geocode.maps.co/search?q=";
    const url = upstream + encodeURIComponent(place);

    const r = await fetch(url, {
      timeout: 10000,
      headers: { "User-Agent": "astro-natal/1.0" },
    });
    if (!r.ok) throw new Error(`geocode upstream ${r.status}`);

    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Place not found", place }),
      };
    }

    const raw = data[0];
    const lat = parseFloat(raw.lat ?? raw.latitude);
    const lon = parseFloat(raw.lon ?? raw.longitude);
    return { statusCode: 200, headers, body: JSON.stringify({ lat, lon, raw }) };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message || String(e) }),
    };
  }
};
