const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const now = new Date().toISOString();

    // Find notes with reminders that are due (past) and not yet notified
    // We'll use a convention: after sending, we clear reminder_at
    const { data: dueNotes, error: notesError } = await supabase
      .from('sticky_notes')
      .select('id, text, reminder_at, user_id')
      .not('reminder_at', 'is', null)
      .lte('reminder_at', now);

    if (notesError) throw new Error(`DB error: ${notesError.message}`);
    if (!dueNotes || dueNotes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;

    for (const note of dueNotes) {
      if (!note.user_id) continue;

      // Get user email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(note.user_id);
      if (userError || !user?.email) continue;

      const noteText = note.text || 'Your reminder is due!';
      const reminderTime = note.reminder_at ? new Date(note.reminder_at).toLocaleString() : 'Now';

      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #fffbeb; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 48px; margin-bottom: 8px;">⏰</div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Reminder Due!</h1>
          </div>
          <div style="padding: 32px; background: #fefce8; border-radius: 0 0 12px 12px;">
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0;">
              <p style="color: #1a1a1a; font-size: 16px; margin: 0; font-style: italic;">"${noteText}"</p>
            </div>
            <p style="color: #555; font-size: 14px;">Scheduled for: <strong>${reminderTime}</strong></p>
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              — The Sticky Notes Team
            </p>
          </div>
        </div>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Sticky Notes <onboarding@resend.dev>',
            to: [user.email],
            subject: `⏰ Reminder: ${noteText.substring(0, 50)}${noteText.length > 50 ? '...' : ''}`,
            html,
          }),
        });

        if (response.ok) {
          // Clear the reminder after sending email
          await supabase
            .from('sticky_notes')
            .update({ reminder_at: null })
            .eq('id', note.id);
          sent++;
        }
      } catch (emailErr) {
        console.error(`Failed to send reminder email for note ${note.id}:`, emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error checking reminders:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
