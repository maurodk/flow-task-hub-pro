
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notification_types: {
    activity_created: boolean;
    activity_updated: boolean;
    event_reminder: boolean;
    subtask_completed: boolean;
  };
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      console.log('⚙️ Buscando preferências de notificação...');
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Converter dados do Supabase para interface local
        const typedPreferences: NotificationPreferences = {
          ...data,
          notification_types: data.notification_types as NotificationPreferences['notification_types']
        };
        setPreferences(typedPreferences);
      } else {
        // Criar preferências padrão se não existirem
        await createDefaultPreferences();
      }
      
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const defaultPrefs = {
        user_id: user.id,
        notification_types: {
          activity_created: true,
          activity_updated: true,
          event_reminder: true,
          subtask_completed: true
        },
        push_enabled: true,
        email_enabled: false
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) throw error;

      // Converter dados do Supabase para interface local
      const typedPreferences: NotificationPreferences = {
        ...data,
        notification_types: data.notification_types as NotificationPreferences['notification_types']
      };
      setPreferences(typedPreferences);
      
    } catch (error) {
      console.error('Erro ao criar preferências padrão:', error);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Converter dados do Supabase para interface local
      const typedPreferences: NotificationPreferences = {
        ...data,
        notification_types: data.notification_types as NotificationPreferences['notification_types']
      };
      setPreferences(typedPreferences);
      
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    updatePreferences,
    requestNotificationPermission,
    fetchPreferences,
  };
};
