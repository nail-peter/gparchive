// Cloudflare Worker for GP Archive
// This replaces the Railway Express server with a free serverless API

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: /api/episodes
    if (url.pathname === '/api/episodes') {
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
          // Sort by modified date, newest first
          .sort((a, b) => new Date(b.modified) - new Date(a.modified));

        return new Response(JSON.stringify(episodes), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // Route: /audio/:filename - Stream audio from R2
    if (url.pathname.startsWith('/audio/')) {
      try {
        const filename = decodeURIComponent(url.pathname.replace('/audio/', ''));
        const object = await env.GPARCHIVE_BUCKET.get(filename);

        if (!object) {
          return new Response('File not found', {
            status: 404,
            headers: corsHeaders
          });
        }

        // Handle range requests for seeking
        const range = request.headers.get('range');

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : object.size - 1;
          const chunkSize = (end - start) + 1;

          const headers = {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'Content-Length': chunkSize.toString(),
            'Content-Range': `bytes ${start}-${end}/${object.size}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
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
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
          'Content-Length': object.size.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        };

        return new Response(object.body, { headers });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'GP Archive API' }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Default response
    return new Response('GP Archive API - Use /api/episodes to list episodes', {
      headers: corsHeaders,
    });
  },
};
