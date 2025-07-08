
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notification_types: {
    activity_created: boolean;
    activity_updated: boolean;
    subtask_completed: boolean;
    mural_post_created: boolean;
    event_reminder_24h: boolean;
    event_reminder_1h: boolean;
  };
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPreferences = {
          user_id: user.id,
          notification_types: {
            activity_created: true,
            activity_updated: true,
            subtask_completed: true,
            mural_post_created: true,
            event_reminder_24h: true,
            event_reminder_1h: true,
          },
          push_enabled: true,
          email_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData);
      }
    } catch (error) {
      console.error('Erro ao buscar preferências de notificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    updatePreferences,
    fetchPreferences
  };
};
