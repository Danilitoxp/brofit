import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, body, data, tag, actions }: PushNotificationRequest = await req.json();

    console.log('Sending push notification:', { user_id, title, body });

    // Buscar subscrições do usuário ou de todos se user_id não fornecido
    let query = supabase
      .from('push_subscriptions')
      .select('*');
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Enviar notificação para cada subscrição
    const promises = subscriptions.map(async (subscription) => {
      try {
        const payload = JSON.stringify({
          title,
          body,
          data: data || {},
          tag: tag || 'brofit-notification',
          actions: actions || []
        });

        // Usar web-push library através de fetch para Web Push Protocol
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'TTL': '86400', // 24 horas
            'Content-Type': 'application/json',
            'Authorization': `vapid t=${await generateVapidToken(vapidPublicKey, vapidPrivateKey, subscription.endpoint)}, k=${vapidPublicKey}`,
          },
          body: payload,
        });

        if (!response.ok) {
          console.error(`Failed to send to ${subscription.endpoint}:`, response.status);
          
          // Remover subscrições inválidas
          if (response.status === 410 || response.status === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
            console.log(`Removed invalid subscription: ${subscription.id}`);
          }
        } else {
          console.log(`Successfully sent to ${subscription.endpoint}`);
        }

        return { success: response.ok, status: response.status };
      } catch (error) {
        console.error(`Error sending to ${subscription.endpoint}:`, error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${results.length} notifications successfully`);

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount}/${results.length} notifications`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Função auxiliar para gerar token VAPID (implementação simplificada)
async function generateVapidToken(publicKey: string, privateKey: string, audience: string): Promise<string> {
  // Para produção, você deveria implementar a assinatura JWT completa do VAPID
  // Por simplicidade, estamos retornando uma string básica
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 horas
    sub: 'mailto:admin@brofit.app'
  }));
  
  return `${header}.${payload}.signature`;
}