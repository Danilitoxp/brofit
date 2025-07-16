import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported || !user) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeUser();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeUser = async () => {
    if (!isSupported || !user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        // Update existing subscription in database
        const subscriptionObj = existingSubscription.toJSON();
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: subscriptionObj.endpoint || '',
            p256dh: subscriptionObj.keys?.p256dh || '',
            auth: subscriptionObj.keys?.auth || ''
          }, {
            onConflict: 'user_id,endpoint'
          });
        return;
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa40HI80NmIjDSGj3E9MIpjB2g1hWNkLtNqWlE6Ox0RZ7EfQYQg9Zm4EBJ9V3Y') // VAPID public key
      });

      // Save subscription to database
      const subscriptionObj = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionObj.endpoint || '',
          p256dh: subscriptionObj.keys?.p256dh || '',
          auth: subscriptionObj.keys?.auth || ''
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }
      
      console.log('Push subscription saved successfully');

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const sendLocalNotification = (title: string, body: string, data?: any) => {
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/lovable-uploads/199efe6d-81da-4ff6-82c3-ce01a564bff3.png',
        badge: '/lovable-uploads/199efe6d-81da-4ff6-82c3-ce01a564bff3.png',
        data,
        tag: 'brofit-notification'
      });
    }
  };

  const scheduleWorkoutReminder = () => {
    if (permission === 'granted') {
      // Schedule reminder for next day at 18:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      
      const now = new Date();
      const timeUntilReminder = tomorrow.getTime() - now.getTime();
      
      if (timeUntilReminder > 0) {
        setTimeout(() => {
          const dayOfWeek = tomorrow.getDay();
          const workoutMessages = [
            "💪 Hora do treino! Seus músculos estão esperando!",
            "🔥 Que tal quebrar alguns recordes hoje?",
            "⚡ Seu corpo agradece cada treino!",
            "🏆 Campeões não descansam, vamos treinar!",
            "💯 Mais um dia para ser sua melhor versão!"
          ];
          
          const randomMessage = workoutMessages[Math.floor(Math.random() * workoutMessages.length)];
          
          sendLocalNotification(
            "Lembrete de Treino - BroFit",
            randomMessage,
            { type: 'workout_reminder', dayOfWeek }
          );
        }, timeUntilReminder);
      }
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendLocalNotification,
    scheduleWorkoutReminder
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}