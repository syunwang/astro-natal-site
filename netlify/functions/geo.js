// GET /.netlify/functions/geo?place=Tainan,%20Taiwan

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method Not Allowed. Use GET." }) };
  }

  try {
    const url = new URL(event.rawUrl || `http://x${event.path}${event.rawQuery ? "?" + event.rawQuery : ""}`);
    const place = url.searchParams.get("place");
    if (!place || !place.trim()) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing required query param: place" }) };
    }

    const base = process.env.FREEASTRO_GEO_URL || "https://nominatim.openstreetmap.org/search";
    const geoUrl = `${base}?format=json&q=${encodeURIComponent(place)}&limit=1`;

    const r = await fetch(geoUrl, { headers: { "User-Agent": "astro-natal-site/1.0 (Netlify Function)" } });
    const txt = await r.text();
    let data; try { data = JSON.parse(txt); } catch { data = txt; }

    if (!r.ok) {
      return { statusCode: r.status, headers: CORS, body: JSON.stringify({ error: "Geo upstream error", status: r.status, body: data }) };
    }

    const first = Array.isArray(data) ? data[0] : data;
    if (!first) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "Place not found" }) };

    const lat = parseFloat(first.lat ?? first.latitude);
    const lon = parseFloat(first.lon ?? first.longitude);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ place, lat, lon, raw: first }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Geo function crashed", detail: String(e) }) };
  }
};
