// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

// Modern Deno.serve (Built-in, no import needed)
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
      console.error('CRITICAL: RESEND_API_KEY is not set in Supabase Secrets.');
      return new Response(JSON.stringify({ error: 'System Configuration Error: RESEND_API_KEY is missing in Cloud Secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Siddipet Urban Development Authority <onboarding@resend.dev>',
        to: to,
        subject: subject,
        html: html,
        text: text
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API Error Response:', data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status, // Pass through the actual status (401, 403, etc)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge Function Exception:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
