// Cloudflare Pages Function: /audio/:filename
export async function onRequest(context) {
  const { env, params, request } = context;

  try {
    const filename = decodeURIComponent(params.filename.join('/'));
    const object = await env.GPARCHIVE_BUCKET.get(filename);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Handle range requests for seeking
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : object.size - 1;
      const chunkSize = (end - start) + 1;

      const headers = {
        'Content-Type': 'audio/mpeg',
        'Content-Length': chunkSize.toString(),
        'Content-Range': `bytes ${start}-${end}/${object.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      };

      // Get the range from R2
      const rangeObject = await env.GPARCHIVE_BUCKET.get(filename, {
        range: { offset: start, length: chunkSize }
      });

      return new Response(rangeObject.body, {
        status: 206,
        headers,
      });
    }

    // No range request - send full file
    const headers = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': object.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
    };

    return new Response(object.body, { headers });
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
