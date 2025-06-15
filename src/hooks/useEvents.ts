
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

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'declined';
  invited_by: string;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
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

  const fetchEventParticipants = async (eventId: string): Promise<EventParticipant[]> => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          profiles!event_participants_user_id_fkey (
            name,
            email,
            avatar_url
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
      toast.error('Erro ao carregar participantes');
      return [];
    }
  };

  const fetchAllUsers = async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
      return [];
    }
  };

  const addParticipant = async (eventId: string, userId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar participantes');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userId,
          invited_by: user.id,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('Participante adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      toast.error('Erro ao adicionar participante');
    }
  };

  const removeParticipant = async (eventId: string, userId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para remover participantes');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Participante removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      toast.error('Erro ao remover participante');
    }
  };

  const updateParticipantStatus = async (eventId: string, status: 'confirmed' | 'declined') => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar participação');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ status })
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(status === 'confirmed' ? 'Participação confirmada!' : 'Participação recusada');
      fetchEvents(); // Atualizar lista de eventos
    } catch (error) {
      console.error('Erro ao atualizar participação:', error);
      toast.error('Erro ao atualizar participação');
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
    fetchEvents,
    fetchEventParticipants,
    fetchAllUsers,
    addParticipant,
    removeParticipant,
    updateParticipantStatus
  };
};
