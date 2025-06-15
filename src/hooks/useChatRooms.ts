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
  const [archivedChatRooms, setArchivedChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const fetchChatRoomsWithSectors = async (isActive: boolean) => {
    if (!user) {
      console.log('No user found, skipping chat rooms fetch');
      return [];
    }

    try {
      console.log(`Fetching ${isActive ? 'active' : 'archived'} chat rooms for user:`, user.id);
      
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', isActive)
        .order('created_at', { ascending: false });

      if (roomsError) {
        console.error(`Error fetching ${isActive ? 'active' : 'archived'} chat rooms:`, roomsError);
        throw roomsError;
      }

      console.log(`${isActive ? 'Active' : 'Archived'} chat rooms data fetched:`, roomsData);

      if (!roomsData || roomsData.length === 0) {
        console.log(`No ${isActive ? 'active' : 'archived'} chat rooms found`);
        return [];
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

      console.log(`Final ${isActive ? 'active' : 'archived'} chat rooms with sectors:`, roomsWithSectors);
      return roomsWithSectors;
    } catch (error) {
      console.error(`Unexpected error fetching ${isActive ? 'active' : 'archived'} chat rooms:`, error);
      throw error;
    }
  };

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const activeChatRooms = await fetchChatRoomsWithSectors(true);
      setChatRooms(activeChatRooms);
    } catch (error) {
      console.error('Error fetching active chat rooms:', error);
      toast.error('Erro ao carregar chats ativos');
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedChatRooms = async () => {
    try {
      setLoadingArchived(true);
      const archived = await fetchChatRoomsWithSectors(false);
      setArchivedChatRooms(archived);
    } catch (error) {
      console.error('Error fetching archived chat rooms:', error);
      toast.error('Erro ao carregar chats arquivados');
      setArchivedChatRooms([]);
    } finally {
      setLoadingArchived(false);
    }
  };

  const createChatRoom = async (name: string, description: string, sectorIds: string[]) => {
    if (!user) {
      console.error('No user found for chat room creation');
      toast.error('Você precisa estar logado para criar um chat');
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating chat room:', { name, description, sectorIds, userId: user.id });
      console.log('User object:', user);

      // Verificar se o usuário pode criar chat rooms
      const { data: canCreateResult, error: canCreateError } = await supabase
        .rpc('user_can_create_chat_room', { user_id: user.id });

      if (canCreateError) {
        console.error('Error checking user permissions:', canCreateError);
        toast.error(`Erro ao verificar permissões: ${canCreateError.message}`);
        throw canCreateError;
      }

      console.log('User can create chat room:', canCreateResult);

      if (!canCreateResult) {
        console.error('User does not have permission to create chat rooms');
        toast.error('Você não tem permissão para criar chats');
        throw new Error('User cannot create chat rooms');
      }

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
        console.error('Room error details:', JSON.stringify(roomError, null, 2));
        toast.error(`Erro ao criar chat: ${roomError.message}`);
        throw roomError;
      }

      console.log('Chat room created successfully:', roomData);

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
          console.error('Sectors error details:', JSON.stringify(sectorsError, null, 2));
          toast.error(`Erro ao vincular setores: ${sectorsError.message}`);
          throw sectorsError;
        }

        console.log('Sectors associated successfully');
      }

      toast.success('Chat criado com sucesso!');
      
      console.log('Refreshing chat rooms after creation...');
      await fetchChatRooms();
      
      return roomData;
    } catch (error) {
      console.error('Error in createChatRoom:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
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

      const { error: deleteError } = await supabase
        .from('chat_room_sectors')
        .delete()
        .eq('chat_room_id', roomId);

      if (deleteError) {
        console.error('Error deleting existing sectors:', deleteError);
        toast.error(`Erro ao remover setores: ${deleteError.message}`);
        throw deleteError;
      }

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
      
      console.log('Refreshing chat rooms after update...');
      await fetchChatRooms();
    } catch (error) {
      console.error('Error in updateChatRoom:', error);
    }
  };

  const archiveChatRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para arquivar um chat');
      return;
    }

    try {
      console.log('Archiving chat room:', roomId);

      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) {
        console.error('Error archiving chat room:', error);
        toast.error(`Erro ao arquivar chat: ${error.message}`);
        throw error;
      }

      toast.success('Chat arquivado com sucesso!');
      
      console.log('Refreshing chat rooms after archiving...');
      await fetchChatRooms();
      await fetchArchivedChatRooms();
    } catch (error) {
      console.error('Error in archiveChatRoom:', error);
    }
  };

  const restoreChatRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para restaurar um chat');
      return;
    }

    try {
      console.log('Restoring chat room:', roomId);

      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: true })
        .eq('id', roomId);

      if (error) {
        console.error('Error restoring chat room:', error);
        toast.error(`Erro ao restaurar chat: ${error.message}`);
        throw error;
      }

      toast.success('Chat restaurado com sucesso!');
      
      console.log('Refreshing chat rooms after restoration...');
      await fetchChatRooms();
      await fetchArchivedChatRooms();
    } catch (error) {
      console.error('Error in restoreChatRoom:', error);
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para excluir um chat');
      return;
    }

    try {
      console.log('Permanently deleting chat room:', roomId);

      // Primeiro, remover vínculos com setores
      const { error: sectorsError } = await supabase
        .from('chat_room_sectors')
        .delete()
        .eq('chat_room_id', roomId);

      if (sectorsError) {
        console.error('Error deleting chat room sectors:', sectorsError);
        toast.error(`Erro ao remover vínculos: ${sectorsError.message}`);
        throw sectorsError;
      }

      // Depois, excluir o chat room permanentemente
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        console.error('Error deleting chat room:', error);
        toast.error(`Erro ao excluir chat: ${error.message}`);
        throw error;
      }

      toast.success('Chat excluído permanentemente!');
      
      console.log('Refreshing chat rooms after deletion...');
      await fetchChatRooms();
      await fetchArchivedChatRooms();
    } catch (error) {
      console.error('Error in deleteChatRoom:', error);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [user?.id]);

  return {
    chatRooms,
    archivedChatRooms,
    loading,
    loadingArchived,
    createChatRoom,
    updateChatRoom,
    archiveChatRoom,
    restoreChatRoom,
    deleteChatRoom,
    fetchChatRooms,
    fetchArchivedChatRooms
  };
};
