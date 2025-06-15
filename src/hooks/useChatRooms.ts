
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sectors?: {
    id: string;
    name: string;
  }[];
}

export const useChatRooms = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_room_sectors(
            sector:sectors(
              id,
              name
            )
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const roomsWithSectors = data?.map(room => ({
        ...room,
        sectors: room.chat_room_sectors?.map((crs: any) => crs.sector).filter(Boolean) || []
      })) || [];

      setChatRooms(roomsWithSectors);
    } catch (error) {
      console.error('Erro ao buscar chat rooms:', error);
      toast.error('Erro ao carregar chats');
    } finally {
      setLoading(false);
    }
  };

  const createChatRoom = async (name: string, description: string, sectorIds: string[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um chat');
      return;
    }

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Vincular aos setores
      if (sectorIds.length > 0) {
        const sectorInserts = sectorIds.map(sectorId => ({
          chat_room_id: roomData.id,
          sector_id: sectorId
        }));

        const { error: sectorsError } = await supabase
          .from('chat_room_sectors')
          .insert(sectorInserts);

        if (sectorsError) throw sectorsError;
      }

      toast.success('Chat criado com sucesso!');
      fetchChatRooms();
      return roomData;
    } catch (error) {
      console.error('Erro ao criar chat room:', error);
      toast.error('Erro ao criar chat');
    }
  };

  const updateChatRoom = async (roomId: string, name: string, description: string, sectorIds: string[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para editar um chat');
      return;
    }

    try {
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .update({
          name,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .eq('created_by', user.id);

      if (roomError) throw roomError;

      // Remover vínculos existentes
      const { error: deleteError } = await supabase
        .from('chat_room_sectors')
        .delete()
        .eq('chat_room_id', roomId);

      if (deleteError) throw deleteError;

      // Adicionar novos vínculos
      if (sectorIds.length > 0) {
        const sectorInserts = sectorIds.map(sectorId => ({
          chat_room_id: roomId,
          sector_id: sectorId
        }));

        const { error: sectorsError } = await supabase
          .from('chat_room_sectors')
          .insert(sectorInserts);

        if (sectorsError) throw sectorsError;
      }

      toast.success('Chat atualizado com sucesso!');
      fetchChatRooms();
    } catch (error) {
      console.error('Erro ao atualizar chat room:', error);
      toast.error('Erro ao atualizar chat');
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir um chat');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId)
        .eq('created_by', user.id);

      if (error) throw error;

      toast.success('Chat excluído com sucesso!');
      fetchChatRooms();
    } catch (error) {
      console.error('Erro ao excluir chat room:', error);
      toast.error('Erro ao excluir chat');
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [user]);

  return {
    chatRooms,
    loading,
    createChatRoom,
    updateChatRoom,
    deleteChatRoom,
    fetchChatRooms
  };
};
