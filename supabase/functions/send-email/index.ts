import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { MagicLinkEmail } from "./_templates/magic-link-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Email function called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // If there's a webhook secret, verify it
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      const {
        user,
        email_data: { token, token_hash, redirect_to, email_action_type },
      } = wh.verify(payload, headers) as {
        user: { email: string };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
          site_url: string;
        };
      };

      let html = "";
      let subject = "";

      // Determine email type and render appropriate template
      if (email_action_type === "signup") {
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "Bem-vindo ao BroFit! Confirme sua conta";
      } else if (email_action_type === "magiclink") {
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "Seu link mágico para o BroFit";
      } else {
        // Default magic link for other cases
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "Acesse sua conta BroFit";
      }

      console.log("Sending email to:", user.email, "with type:", email_action_type);

      const { error } = await resend.emails.send({
        from: "BroFit <onboarding@resend.dev>",
        to: [user.email],
        subject,
        html,
      });

      if (error) {
        console.error("Resend error:", error);
        throw error;
      }

      console.log("Email sent successfully");
    } else {
      // Handle direct API calls (for testing or other uses)
      const body = JSON.parse(payload);
      
      let html = "";
      let subject = "";
      
      if (body.type === "welcome") {
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token: body.token || "",
            token_hash: body.token_hash || "",
            redirect_to: body.redirect_to || "",
            email_action_type: "signup",
          })
        );
        subject = "Bem-vindo ao BroFit! Confirme sua conta";
      } else {
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token: body.token || "",
            token_hash: body.token_hash || "",
            redirect_to: body.redirect_to || "",
            email_action_type: "magiclink",
          })
        );
        subject = "Seu link mágico para o BroFit";
      }

      const { error } = await resend.emails.send({
        from: "BroFit <onboarding@resend.dev>",
        to: [body.email],
        subject,
        html,
      });

      if (error) {
        console.error("Resend error:", error);
        throw error;
      }

      console.log("Direct email sent successfully");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);