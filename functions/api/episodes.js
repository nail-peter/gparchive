// Cloudflare Pages Function: /api/episodes
export async function onRequest(context) {
  const { env } = context;

  try {
    // List all objects in the R2 bucket
    const listed = await env.GPARCHIVE_BUCKET.list();

    // Filter for MP3 files and format the response
    const episodes = listed.objects
      .filter(obj => obj.key.endsWith('.mp3'))
      .map(obj => ({
        name: obj.key,
        size: obj.size,
        modified: obj.uploaded.toISOString(),
        url: `/audio/${encodeURIComponent(obj.key)}`,
        source: 'r2'
      }))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return new Response(JSON.stringify(episodes), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
