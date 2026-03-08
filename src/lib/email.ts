import { supabase } from "@/integrations/supabase/client";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  reply_to?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: options,
  });

  if (error) throw new Error(error.message);
  return data;
}

// Pre-built templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Sticky Notes! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fffbe6; border-radius: 12px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Welcome, ${name}! 👋</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          We're thrilled to have you on board. Start creating sticky notes, organize your thoughts, and share boards with friends.
        </p>
        <a href="${window.location.origin}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Get Started
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The Sticky Notes Team</p>
      </div>
    `,
  }),

  notification: (title: string, message: string) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #1a1a1a; font-size: 20px;">${title}</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">${message}</p>
        <a href="${window.location.origin}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Open Sticky Notes
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The Sticky Notes Team</p>
      </div>
    `,
  }),

  reminder: (noteText: string, reminderTime: string) => ({
    subject: "⏰ Sticky Note Reminder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fffbe6; border-radius: 12px;">
        <h2 style="color: #1a1a1a; font-size: 20px;">⏰ Reminder</h2>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0;">
          <p style="color: #1a1a1a; font-size: 16px; margin: 0;">${noteText}</p>
        </div>
        <p style="color: #555; font-size: 14px;">Scheduled for: ${reminderTime}</p>
        <a href="${window.location.origin}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Note
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The Sticky Notes Team</p>
      </div>
    `,
  }),
};
