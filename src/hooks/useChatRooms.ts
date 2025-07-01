
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ChatRoom } from '@/types/chatRoom';
import { fetchChatRoomsWithSectors } from '@/services/chatRoomService';
import {
  createChatRoom as createChatRoomOperation,
  updateChatRoom as updateChatRoomOperation,
  archiveChatRoom as archiveChatRoomOperation,
  restoreChatRoom as restoreChatRoomOperation,
  deleteChatRoom as deleteChatRoomOperation
} from '@/services/chatRoomOperations';

export const useChatRooms = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [archivedChatRooms, setArchivedChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Força re-fetch

  const fetchChatRooms = async (forceFetch = false) => {
    if (!user?.id) {
      console.log('[useChatRooms] No user found, skipping fetch');
      setChatRooms([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('[useChatRooms] Starting to fetch active chat rooms...', { 
        userId: user.id, 
        forceFetch,
        refreshKey 
      });
      
      const activeChatRooms = await fetchChatRoomsWithSectors(true, user.id);
      
      console.log('[useChatRooms] Fetched active chat rooms:', {
        count: activeChatRooms.length,
        rooms: activeChatRooms.map(r => ({ 
          id: r.id, 
          name: r.name, 
          created_by: r.created_by,
          sectors: r.sectors?.map(s => s.name) || []
        }))
      });
      
      setChatRooms(activeChatRooms);
      console.log('[useChatRooms] State updated with active chat rooms');
    } catch (error) {
      console.error('[useChatRooms] Error fetching active chat rooms:', error);
      toast.error('Erro ao carregar chats ativos');
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedChatRooms = async () => {
    if (!user?.id) {
      setArchivedChatRooms([]);
      return;
    }
    
    try {
      setLoadingArchived(true);
      console.log('[useChatRooms] Fetching archived chat rooms...');
      const archived = await fetchChatRoomsWithSectors(false, user.id);
      console.log('[useChatRooms] Fetched archived chat rooms:', {
        count: archived.length,
        rooms: archived.map(r => ({ 
          id: r.id, 
          name: r.name,
          sectors: r.sectors?.map(s => s.name) || []
        }))
      });
      setArchivedChatRooms(archived);
    } catch (error) {
      console.error('[useChatRooms] Error fetching archived chat rooms:', error);
      toast.error('Erro ao carregar chats arquivados');
      setArchivedChatRooms([]);
    } finally {
      setLoadingArchived(false);
    }
  };

  const forceRefresh = () => {
    console.log('[useChatRooms] Force refresh triggered');
    setRefreshKey(prev => prev + 1);
  };

  const createChatRoom = async (name: string, description: string, sectorIds: string[]) => {
    if (!user?.id) return;
    
    try {
      console.log('[useChatRooms] Creating chat room:', { name, description, sectorIds });
      await createChatRoomOperation(name, description, sectorIds, user.id);
      console.log('[useChatRooms] Chat room created successfully, refreshing...');
      
      // Força uma atualização completa
      await fetchChatRooms(true);
      toast.success('Chat criado com sucesso!');
    } catch (error) {
      console.error('[useChatRooms] Error creating chat room:', error);
      throw error;
    }
  };

  const updateChatRoom = async (roomId: string, name: string, description: string, sectorIds: string[]) => {
    if (!user?.id) return;
    
    try {
      console.log('[useChatRooms] Updating chat room:', roomId);
      await updateChatRoomOperation(roomId, name, description, sectorIds, user.id);
      console.log('[useChatRooms] Chat room updated, refreshing...');
      await fetchChatRooms(true);
      toast.success('Chat atualizado com sucesso!');
    } catch (error) {
      console.error('[useChatRooms] Error updating chat room:', error);
      toast.error('Erro ao atualizar chat');
    }
  };

  const archiveChatRoom = async (roomId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('[useChatRooms] Archiving chat room:', roomId);
      await archiveChatRoomOperation(roomId, user.id);
      console.log('[useChatRooms] Chat room archived, refreshing...');
      await fetchChatRooms(true);
      await fetchArchivedChatRooms();
      toast.success('Chat arquivado com sucesso!');
    } catch (error) {
      console.error('[useChatRooms] Error archiving chat room:', error);
      toast.error('Erro ao arquivar chat');
    }
  };

  const restoreChatRoom = async (roomId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('[useChatRooms] Restoring chat room:', roomId);
      await restoreChatRoomOperation(roomId, user.id);
      console.log('[useChatRooms] Chat room restored, refreshing...');
      await fetchChatRooms(true);
      await fetchArchivedChatRooms();
      toast.success('Chat restaurado com sucesso!');
    } catch (error) {
      console.error('[useChatRooms] Error restoring chat room:', error);
      toast.error('Erro ao restaurar chat');
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!user?.id) return;
    
    try {
      console.log('[useChatRooms] Deleting chat room:', roomId);
      await deleteChatRoomOperation(roomId, user.id);
      console.log('[useChatRooms] Chat room deleted, refreshing...');
      await fetchChatRooms(true);
      await fetchArchivedChatRooms();
      toast.success('Chat excluído permanentemente!');
    } catch (error) {
      console.error('[useChatRooms] Error deleting chat room:', error);
      toast.error('Erro ao excluir chat');
    }
  };

  useEffect(() => {
    console.log('[useChatRooms] useEffect triggered with:', { userId: user?.id, refreshKey });
    fetchChatRooms();
  }, [user?.id, refreshKey]);

  // Log sempre que o estado chatRooms mudar
  useEffect(() => {
    console.log('[useChatRooms] chatRooms state changed:', {
      count: chatRooms.length,
      rooms: chatRooms.map(r => ({ id: r.id, name: r.name, sectors: r.sectors?.map(s => s.name) || [] }))
    });
  }, [chatRooms]);

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
    fetchArchivedChatRooms,
    forceRefresh, // Nova função para forçar refresh
  };
};

// Re-export the ChatRoom type for backward compatibility
export type { ChatRoom };
