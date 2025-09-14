
// Netlify Function: /natal
export async function handler(event, context) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({error:"Method Not Allowed"}) };
  }

  try {
    const apiKey = process.env.FREEASTRO_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({error:"FREEASTRO_API_KEY missing"}) };
    }
    const API_URL = process.env.FREEASTRO_API_URL || "https://api.freeastrologyapi.com/api/v1/natal";

    const payload = JSON.parse(event.body || "{}");

    const r = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    if (text.trim().startsWith("<svg")) {
      return { statusCode: r.status, headers: {...cors, "Content-Type":"application/json"}, body: JSON.stringify({svg:text}) };
    }
    let data;
    try { data = JSON.parse(text); } catch(e){ data = {raw:text}; }
    return { statusCode: r.status, headers: {...cors, "Content-Type":"application/json"}, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({error:e.message}) };
  }
}
