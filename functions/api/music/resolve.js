// Cloudflare Pages Function: /api/music/resolve
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  return new Response(JSON.stringify({
    id,
    src: '/summer-nights.mp3',
    durationSeconds: 210,
    playback: 'audio',
    title: 'YouTube Music'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
