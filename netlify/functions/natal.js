// netlify/functions/natal.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const payload = JSON.parse(event.body || "{}");

    const required = ["year","month","date","hours","minutes","seconds","latitude","longitude","timezone"];
    for (const k of required) {
      if (payload[k] === undefined || payload[k] === null) {
        return { statusCode: 400, body: `Missing '${k}'` };
      }
    }

    const body = {
      year: Number(payload.year),
      month: Number(payload.month),
      date: Number(payload.date),
      hours: Number(payload.hours),
      minutes: Number(payload.minutes),
      seconds: Number(payload.seconds ?? 0),
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      timezone: Number(payload.timezone),
      config: {
        observation_point: payload?.config?.observation_point || "topocentric",
        ayanamsha: payload?.config?.ayanamsha || "tropical",
        house_system: payload?.config?.house_system || "Placidus",
        language: payload?.config?.language || "en",
        exclude_planets: payload?.config?.exclude_planets || [],
        allowed_aspects: payload?.config?.allowed_aspects || [
          "Conjunction","Opposition","Trine","Square","Sextile",
          "Semi-Sextile","Quintile","Septile","Octile","Novile",
          "Quincunx","Sesquiquadrate"
        ]
      }
    };

    const resp = await fetch("https://json.freeastrologyapi.com/western/natal-wheel-chart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.FREEASTRO_API_KEY
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
