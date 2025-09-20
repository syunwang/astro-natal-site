// netlify/functions/geo.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS };
  }

  try {
    const place = event.queryStringParameters?.place || "";
    if (!place) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "Missing query parameter: place" }),
      };
    }

    const base =
      process.env.FREEASTRO_GEO_URL ||
      "https://nominatim.openstreetmap.org/search?format=json&q=";

    const url = `${base}${encodeURIComponent(place)}`;

    // ✅ Node18+ 自带 fetch
    const res = await fetch(url, {
      headers: { "User-Agent": "netlify-function/geo" },
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      return {
        statusCode: res.status,
        headers: CORS,
        body: JSON.stringify({ error: "Geo upstream error", raw }),
      };
    }

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Geo function error", message: String(err) }),
    };
  }
};
