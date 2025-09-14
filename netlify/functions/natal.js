// netlify/functions/natal.js
const API = 'https://api.freeastrologyapi.com/v1/natal-chart';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const key = process.env.FREEASTRO_API_KEY;
  let payload = {};
  try { payload = JSON.parse(event.body || '{}') } catch(e){}

  if(!key){
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'FREEASTRO_API_KEY not set', received: payload })
    };
  }

  try{
    const r = await fetch(API, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-api-key': key },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(async ()=>({ raw: await r.text() }));
    return { statusCode: r.status, body: JSON.stringify(data) };
  }catch(e){
    return { statusCode: 500, body: JSON.stringify({ error: e.message })};
  }
}
