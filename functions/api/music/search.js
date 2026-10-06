// Cloudflare Pages Function: /api/music/search
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const id = (url.searchParams.get('id') || '').trim();

  // If searching by ID (for related / recommendations)
  if (id && /^[\w-]{11}$/.test(id)) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  if (!q) {
    return new Response(JSON.stringify({ error: 'Please enter a song title.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    const res = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await res.text();
    const idMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const titleMatch = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);

    if (!idMatch) {
      return new Response(JSON.stringify({ error: 'Song not found on YouTube. Try a different title.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const videoId = idMatch[1];
    let title = titleMatch ? titleMatch[1] : q;
    let artist = 'YouTube';

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').replace(/\(Official.*|\(Lyrics.*|\[Official.*|\[Lyrics.*/i, '').trim();
    }

    const track = {
      id: videoId,
      videoId: videoId,
      title: title || q,
      artist: artist || 'YouTube',
      duration: '3:30',
      durationSeconds: 210,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };

    return new Response(JSON.stringify(track), {
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
