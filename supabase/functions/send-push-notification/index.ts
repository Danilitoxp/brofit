import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id?: string;
  title: string;
  body: string;
  data?: any;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { user_id, title, body, data, tag, actions }: PushNotificationRequest = await req.json();

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    webpush.setVapidDetails('mailto:support@brofit.app', vapidPublicKey, vapidPrivateKey);

    let query = supabase.from('push_subscriptions').select('*');
    if (user_id) query = query.eq('user_id', user_id);

    const { data: subscriptions, error: subError } = await query;
    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = (s: any) => JSON.stringify({
      title,
      body,
      data: data || {},
      tag: tag || 'brofit-notification',
      actions: actions || [],
    });

    const results = await Promise.all(
      subscriptions.map(async (s: any) => {
        try {
          const subscription = {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          } as webpush.PushSubscription;

          await webpush.sendNotification(subscription, payload(s));
          return { success: true };
        } catch (err: any) {
          // Remove invalid/expired subscriptions
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id);
          }
          console.error('Push send error:', err?.statusCode, err?.message);
          return { success: false, error: err?.message, status: err?.statusCode };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({ message: `Sent ${successCount}/${results.length} notifications`, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
