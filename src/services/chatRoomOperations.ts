
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createChatRoom = async (
  name: string, 
  description: string, 
  sectorIds: string[], 
  userId: string
) => {
  if (!userId) {
    console.error('No user found for chat room creation');
    toast.error('Você precisa estar logado para criar um chat');
    throw new Error('User not authenticated');
  }

  try {
    console.log('Creating chat room:', { name, description, sectorIds, userId });

    // Verificar se o usuário pode criar chat rooms
    const { data: canCreateResult, error: canCreateError } = await supabase
      .rpc('user_can_create_chat_room', { user_id: userId });

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
        created_by: userId,
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
    return roomData;
  } catch (error) {
    console.error('Error in createChatRoom:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
};

export const updateChatRoom = async (
  roomId: string, 
  name: string, 
  description: string, 
  sectorIds: string[], 
  userId: string
) => {
  if (!userId) {
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
  } catch (error) {
    console.error('Error in updateChatRoom:', error);
  }
};

export const archiveChatRoom = async (roomId: string, userId: string) => {
  if (!userId) {
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
  } catch (error) {
    console.error('Error in archiveChatRoom:', error);
  }
};

export const restoreChatRoom = async (roomId: string, userId: string) => {
  if (!userId) {
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
  } catch (error) {
    console.error('Error in restoreChatRoom:', error);
  }
};

export const deleteChatRoom = async (roomId: string, userId: string) => {
  if (!userId) {
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
  } catch (error) {
    console.error('Error in deleteChatRoom:', error);
  }
};
