// netlify/functions/geo.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const { location } = JSON.parse(event.body || "{}");
    if (!location) {
      return { statusCode: 400, body: "Missing 'location'" };
    }

    const resp = await fetch("https://json.freeastrologyapi.com/geo-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.FREEASTRO_API_KEY
      },
      body: JSON.stringify({ location })
    });

    const data = await resp.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
