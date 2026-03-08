const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { owner_id, guest_name } = await req.json();

    if (!owner_id) {
      return new Response(
        JSON.stringify({ error: 'Missing owner_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get owner's email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(owner_id);
    if (userError || !user?.email) {
      throw new Error('Could not find owner email');
    }

    const name = guest_name || 'Someone';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #dbeafe; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="font-size: 48px; margin-bottom: 8px;">🤝</div>
          <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Someone joined your board!</h1>
        </div>
        <div style="padding: 32px; background: #f0f9ff; border-radius: 0 0 12px 12px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            <strong>${name}</strong> has joined your Sticky Notes board using your share code.
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            They can now view and edit notes on your shared board. You'll see their notes too!
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="\${siteUrl}" style="display: inline-block; padding: 14px 32px; background: #3b82f6; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Open Your Board →
            </a>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            — The Sticky Notes Team
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sticky Notes <onboarding@resend.dev>',
        to: [user.email],
        subject: `${name} joined your Sticky Notes board! 🤝`,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending board share email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
