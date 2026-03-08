const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { email, display_name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const name = display_name || 'there';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #fef3c7; padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="font-size: 48px; margin-bottom: 8px;">📝</div>
          <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">Welcome to Sticky Notes!</h1>
        </div>
        <div style="padding: 32px; background: #fffbe6; border-radius: 0 0 12px 12px;">
          <p style="color: #333; font-size: 18px; line-height: 1.6;">Hey ${name}! 👋</p>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            We're thrilled to have you on board. With Sticky Notes, you can:
          </p>
          <ul style="color: #555; font-size: 15px; line-height: 2;">
            <li>📌 Create colorful sticky notes</li>
            <li>🎨 Customize colors and layouts</li>
            <li>🤝 Share boards with friends</li>
            <li>⏰ Set reminders on notes</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="\${siteUrl}" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Start Creating Notes →
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
        to: [email],
        subject: `Welcome to Sticky Notes, ${name}! 🎉`,
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
    console.error('Error sending welcome email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
