import type { VercelRequest, VercelResponse } from '@vercel/node';

const URL = 'https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/standings/total';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const r = await fetch(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
  });

  if (!r.ok) {
    res.status(r.status).json({ error: 'upstream error' });
    return;
  }

  const data = await r.json();
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.status(200).json(data);
}
