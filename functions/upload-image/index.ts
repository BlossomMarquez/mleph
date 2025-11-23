declare const Deno: any;
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE are required environment variables');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE!, {
  global: { fetch }
});

export default async function (request: Request) {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const head = form.get('head')?.toString() || '';
    const title = form.get('title')?.toString() || '';
    const tagsRaw = form.get('tags')?.toString() || '';
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

    if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    const fileName = `${Date.now()}_${(file as any).name || 'upload'}`;

    const arrayBuffer = await (file as any).arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const { error: uploadErr } = await supabase.storage.from('gallery').upload(fileName, uint8, {
      contentType: (file as any).type || 'application/octet-stream'
    });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: uploadErr.message }), { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(fileName);
    const imageUrl = urlData?.publicUrl || null;

    const { data: rpcData, error: rpcError } = await supabase.rpc('insert_gallery_with_tags', {
      p_head: head,
      p_title: title,
      p_image_url: imageUrl,
      p_tags: tags
    });

    if (rpcError) {
      try { await supabase.storage.from('gallery').remove([fileName]); } catch (e) { }
      return new Response(JSON.stringify({ error: rpcError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: rpcData?.[0]?.id ?? null, imageUrl }), { status: 200 });
  } catch (err) {
    console.error('edge upload error', err);
    return new Response(JSON.stringify({ error: (err as any)?.message || 'Server error' }), { status: 500 });
  }
}
