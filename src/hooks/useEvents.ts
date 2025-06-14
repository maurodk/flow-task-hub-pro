
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  created_by: string;
  attendees_count: number;
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (title: string, description: string, eventDate: string, eventTime: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um evento');
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title,
          description,
          event_date: eventDate,
          event_time: eventTime,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Evento criado com sucesso!');
      fetchEvents();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
    }
  };

  const updateEvent = async (eventId: string, title: string, description: string, eventDate: string, eventTime: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar um evento');
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title,
          description,
          event_date: eventDate,
          event_time: eventTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('created_by', user.id);

      if (error) throw error;

      toast.success('Evento atualizado com sucesso!');
      fetchEvents();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast.error('Erro ao atualizar evento');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir um evento');
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('created_by', user.id);

      if (error) throw error;

      toast.success('Evento excluído com sucesso!');
      fetchEvents();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEvents
  };
};
