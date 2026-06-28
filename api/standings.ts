import type { VercelRequest, VercelResponse } from '@vercel/node';

const URL = 'https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/standings/total';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const r = await fetch(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.sofascore.com/',
      'Origin': 'https://www.sofascore.com',
      'Cache-Control': 'no-cache',
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
