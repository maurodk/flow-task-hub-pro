
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
      console.log('No user found, skipping chat rooms fetch');
      setChatRooms([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching chat rooms for user:', user.id);
      
      // Buscar todos os chat rooms ativos primeiro
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (roomsError) {
        console.error('Error fetching chat rooms:', roomsError);
        toast.error(`Erro ao carregar chats: ${roomsError.message}`);
        setChatRooms([]);
        return;
      }

      console.log('Chat rooms data fetched:', roomsData);

      if (!roomsData || roomsData.length === 0) {
        console.log('No chat rooms found');
        setChatRooms([]);
        return;
      }

      // Buscar os setores para cada chat room
      const roomsWithSectors = await Promise.all(
        roomsData.map(async (room) => {
          try {
            const { data: sectorsData, error: sectorsError } = await supabase
              .from('chat_room_sectors')
              .select(`
                sector:sectors(
                  id,
                  name
                )
              `)
              .eq('chat_room_id', room.id);

            if (sectorsError) {
              console.error(`Error fetching sectors for room ${room.id}:`, sectorsError);
              return {
                ...room,
                sectors: []
              };
            }

            const sectors = sectorsData?.map((crs: any) => crs.sector).filter(Boolean) || [];
            console.log(`Room ${room.name} has sectors:`, sectors);

            return {
              ...room,
              sectors
            };
          } catch (error) {
            console.error(`Error processing room ${room.id}:`, error);
            return {
              ...room,
              sectors: []
            };
          }
        })
      );

      console.log('Final chat rooms with sectors:', roomsWithSectors);
      setChatRooms(roomsWithSectors);
    } catch (error) {
      console.error('Unexpected error fetching chat rooms:', error);
      toast.error('Erro inesperado ao carregar chats');
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const createChatRoom = async (name: string, description: string, sectorIds: string[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um chat');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating chat room:', { name, description, sectorIds, userId: user.id });

      // Criar o chat room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (roomError) {
        console.error('Error creating chat room:', roomError);
        toast.error(`Erro ao criar chat: ${roomError.message}`);
        throw roomError;
      }

      console.log('Chat room created successfully:', roomData);

      // Vincular aos setores se houver
      if (sectorIds.length > 0) {
        console.log('Associating sectors to chat room:', sectorIds);
        
        const sectorInserts = sectorIds.map(sectorId => ({
          chat_room_id: roomData.id,
          sector_id: sectorId
        }));

        const { error: sectorsError } = await supabase
          .from('chat_room_sectors')
          .insert(sectorInserts);

        if (sectorsError) {
          console.error('Error associating sectors:', sectorsError);
          toast.error(`Erro ao vincular setores: ${sectorsError.message}`);
          throw sectorsError;
        }

        console.log('Sectors associated successfully');
      }

      toast.success('Chat criado com sucesso!');
      
      // Refresh automático após criar
      console.log('Refreshing chat rooms after creation...');
      await fetchChatRooms();
      
      return roomData;
    } catch (error) {
      console.error('Error in createChatRoom:', error);
      throw error;
    }
  };

  const updateChatRoom = async (roomId: string, name: string, description: string, sectorIds: string[]) => {
    if (!user) {
      toast.error('Você precisa estar logado para editar um chat');
      return;
    }

    try {
      console.log('Updating chat room:', { roomId, name, description, sectorIds });

      const { error: roomError } = await supabase
        .from('chat_rooms')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (roomError) {
        console.error('Error updating chat room:', roomError);
        toast.error(`Erro ao atualizar chat: ${roomError.message}`);
        throw roomError;
      }

      // Remover vínculos existentes
      const { error: deleteError } = await supabase
        .from('chat_room_sectors')
        .delete()
        .eq('chat_room_id', roomId);

      if (deleteError) {
        console.error('Error deleting existing sectors:', deleteError);
        toast.error(`Erro ao remover setores: ${deleteError.message}`);
        throw deleteError;
      }

      // Adicionar novos vínculos
      if (sectorIds.length > 0) {
        const sectorInserts = sectorIds.map(sectorId => ({
          chat_room_id: roomId,
          sector_id: sectorId
        }));

        const { error: sectorsError } = await supabase
          .from('chat_room_sectors')
          .insert(sectorInserts);

        if (sectorsError) {
          console.error('Error inserting new sectors:', sectorsError);
          toast.error(`Erro ao vincular novos setores: ${sectorsError.message}`);
          throw sectorsError;
        }
      }

      toast.success('Chat atualizado com sucesso!');
      
      // Refresh automático após atualizar
      console.log('Refreshing chat rooms after update...');
      await fetchChatRooms();
    } catch (error) {
      console.error('Error in updateChatRoom:', error);
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir um chat');
      return;
    }

    try {
      console.log('Deleting chat room:', roomId);

      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) {
        console.error('Error deleting chat room:', error);
        toast.error(`Erro ao excluir chat: ${error.message}`);
        throw error;
      }

      toast.success('Chat excluído com sucesso!');
      
      // Refresh automático após excluir
      console.log('Refreshing chat rooms after deletion...');
      await fetchChatRooms();
    } catch (error) {
      console.error('Error in deleteChatRoom:', error);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [user?.id]);

  return {
    chatRooms,
    loading,
    createChatRoom,
    updateChatRoom,
    deleteChatRoom,
    fetchChatRooms
  };
};
