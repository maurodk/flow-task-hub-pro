
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
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching chat rooms for user:', user.id);
      
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

      if (error) {
        console.error('Error fetching chat rooms:', error);
        throw error;
      }

      console.log('Chat rooms fetched:', data);

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
      console.log('Creating chat room:', { name, description, sectorIds, userId: user.id });

      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating chat room:', roomError);
        throw roomError;
      }

      console.log('Chat room created:', roomData);

      // Vincular aos setores se houver
      if (sectorIds.length > 0) {
        const sectorInserts = sectorIds.map(sectorId => ({
          chat_room_id: roomData.id,
          sector_id: sectorId
        }));

        console.log('Inserting sector associations:', sectorInserts);

        const { error: sectorsError } = await supabase
          .from('chat_room_sectors')
          .insert(sectorInserts);

        if (sectorsError) {
          console.error('Error associating sectors:', sectorsError);
          throw sectorsError;
        }

        console.log('Sectors associated successfully');
      }

      toast.success('Chat criado com sucesso!');
      await fetchChatRooms();
      return roomData;
    } catch (error) {
      console.error('Erro ao criar chat room:', error);
      toast.error('Erro ao criar chat');
      throw error;
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
      await fetchChatRooms();
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
      await fetchChatRooms();
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
