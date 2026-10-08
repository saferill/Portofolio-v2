// Cloudflare Pages Function: /api/music/search
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const id = (url.searchParams.get('id') || '').trim();
  const artist = (url.searchParams.get('artist') || '').trim();
  const title = (url.searchParams.get('title') || '').trim();
  const type = (url.searchParams.get('type') || '').trim();

  // Determine query mode:
  // 1. If searching by ID (recommendations / up next)
  // 2. If searching by query string
  let searchQuery = '';
  const isRecommendation = Boolean(id && /^[\w-]{11}$/.test(id));

  if (isRecommendation) {
    if (artist && artist.toLowerCase() !== 'youtube') {
      searchQuery = `${artist} songs`;
    } else if (title) {
      searchQuery = `${title} mix`;
    } else {
      searchQuery = `${id} songs`;
    }
  } else if (q) {
    searchQuery = q;
  } else {
    return new Response(JSON.stringify({ error: 'Please enter a song title or ID.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await res.text();
    const tracks = [];
    const seen = new Set();
    if (id) seen.add(id);

    const blocks = html.split('"videoRenderer":{').slice(1);
    for (const block of blocks) {
      const idMatch = block.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      const titleMatch = block.match(/"title":\{"runs":\[\{"text":"([^"]+)"\}\]/);
      if (!idMatch || !titleMatch) continue;

      const vId = idMatch[1];
      if (seen.has(vId)) continue;
      seen.add(vId);

      let rawTitle = titleMatch[1].replace(/\\u0026/g, '&');
      let artistName = 'YouTube';

      const bylineMatch = block.match(/"(?:longBylineText|ownerText)":\{"runs":\[\{"text":"([^"]+)"\}\]/);
      if (bylineMatch) {
        artistName = bylineMatch[1].replace(/\\u0026/g, '&');
      }

      let cleanTitle = rawTitle;
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        artistName = parts[0].trim();
        cleanTitle = parts.slice(1).join(' - ');
      }
      cleanTitle = cleanTitle.replace(/\(Official.*|\(Lyrics.*|\[Official.*|\[Lyrics.*/i, '').trim();

      let durationStr = '3:30';
      let durationSec = 210;
      const lengthMatch = block.match(/"lengthText":\{"simpleText":"(\d+:\d+)"\}/);
      if (lengthMatch) {
        durationStr = lengthMatch[1];
        const [m, s] = durationStr.split(':').map(Number);
        if (Number.isFinite(m) && Number.isFinite(s)) {
          durationSec = (m * 60) + s;
        }
      }

      tracks.push({
        id: vId,
        videoId: vId,
        title: cleanTitle || rawTitle,
        artist: artistName || 'YouTube',
        duration: durationStr,
        durationSeconds: durationSec,
        thumbnail: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`
      });

      if (tracks.length >= 8) break;
    }

    // If recommendation or multiple requested, return array of tracks
    if (isRecommendation || type === 'video' || type === 'multiple') {
      return new Response(JSON.stringify(tracks), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=1800'
        }
      });
    }

    // Otherwise for single query /play, return the top track
    if (!tracks.length) {
      return new Response(JSON.stringify({ error: 'Song not found on YouTube. Try a different title.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify(tracks[0]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Search error: ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
